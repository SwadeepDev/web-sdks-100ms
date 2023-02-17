/* eslint-disable complexity */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-shadow */
import {
  HMSPeer,
  HMSPreferredSimulcastLayer,
  HMSScreenVideoTrack,
  HMSSimulcastLayerDefinition,
  HMSTrack,
  HMSTrackID,
  HMSVideoTrack,
} from '@100mslive/hms-video-store';

export const chunk = <T>(elements: T[], chunkSize: number, onlyOnePage: boolean) =>
  elements.reduce((resultArray: T[][], tile: T, index: number) => {
    const chunkIndex = Math.floor(index / chunkSize);
    if (chunkIndex > 0 && onlyOnePage) {
      return resultArray;
    }
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(tile);
    return resultArray;
  }, []);

interface ChunkElements<T> {
  elements: T[];
  tilesInFirstPage: number;
  onlyOnePage: boolean;
  isLastPageDifferentFromFirstPage: boolean;
  defaultWidth: number;
  defaultHeight: number;
  lastPageWidth: number;
  lastPageHeight: number;
}

/**
 * Given a list of tracks/elements and some constraints, group the tracks in separate pages.
 * @return 2D list for every page which has the original element and height and width
 * for its tile.
 */
export const chunkElements = <T>({
  elements,
  tilesInFirstPage,
  onlyOnePage,
  isLastPageDifferentFromFirstPage,
  defaultWidth,
  defaultHeight,
  lastPageWidth,
  lastPageHeight,
}: ChunkElements<T>): (T & { width: number; height: number })[][] => {
  const chunks: T[][] = chunk<T>(elements, tilesInFirstPage, onlyOnePage);
  return chunks.map((ch, page) =>
    ch.map(element => {
      const isLastPage: boolean = page === chunks.length - 1;
      const width = isLastPageDifferentFromFirstPage && isLastPage ? lastPageWidth : defaultWidth;
      const height = isLastPageDifferentFromFirstPage && isLastPage ? lastPageHeight : defaultHeight;
      return { ...element, height, width };
    }),
  );
};

/**
 * Mathematical mode - the element with the highest occurrence in an array
 * @param array
 */
export function mode(array: number[]): number | null {
  if (array.length === 0) {
    return null;
  }
  const modeMap: Record<number, number> = {};
  let maxEl = array[0];
  let maxCount = 1;
  for (let i = 0; i < array.length; i++) {
    const el = array[i];
    if (modeMap[el] === null) {
      modeMap[el] = 1;
    } else {
      modeMap[el]++;
    }
    if (modeMap[el] > maxCount) {
      maxEl = el;
      maxCount = modeMap[el];
    }
  }
  return maxEl;
}

export type TrackWithPeer = { track?: HMSVideoTrack | HMSScreenVideoTrack; peer: HMSPeer };

/**
 * get the aspect ration occurring with the highest frequency
 * @param tracks - video tracks to infer aspect ratios from
 */
export const getModeAspectRatio = (tracks: TrackWithPeer[]): number | null =>
  mode(
    tracks
      .filter(track => track.track?.width && track.track?.height)
      .map(track => {
        const width = track.track?.width;
        const height = track.track?.height;
        // Default to 1 if there are no video tracks
        return (width || 1) / (height || 1);
      }),
  );

interface GetTileSizesInList {
  count: number;
  parentWidth: number;
  parentHeight: number;
  maxTileCount?: number;
  maxRowCount?: number;
  maxColCount?: number;
  aspectRatio: {
    width: number;
    height: number;
  };
}

interface GetTileSizes {
  parentWidth: number;
  parentHeight: number;
  count: number;
  maxCount: number;
  aspectRatio: { width: number; height: number };
}

/**
 * Finds the largest rectangle area when trying to place N rectangle into a containing
 * rectangle without rotation.
 *
 * @param {Number}  containerWidth      The width of the container.
 * @param {Number}  containerHeight     The height of the container.
 * @param {Number}  numRects            How many rectangles must fit within.
 * @param {Number}  width               The unscaled width of the rectangles to be placed.
 * @param {Number}  height              The unscaled height of the rectangles to be placed.
 * @return {Object}                     The area and number of rows and columns that fit.
 */
export const largestRect = (
  containerWidth: number,
  containerHeight: number,
  numRects: number,
  width: number | undefined,
  height: number | undefined,
) => {
  if (containerWidth < 0 || containerHeight < 0) {
    throw new Error('Container must have a non-negative area');
  }
  if (numRects < 1 || !Number.isInteger(numRects)) {
    throw new Error('Number of shapes to place must be a positive integer');
  }
  const aspectRatio = width && height && width / height;
  if (aspectRatio !== undefined && isNaN(aspectRatio)) {
    throw new Error('Aspect ratio must be a number');
  }

  let best = { area: 0, cols: 0, rows: 0, width: 0, height: 0 };

  // TODO: Don't start with obviously-`ba`d candidates.
  const startCols = numRects;
  const colDelta = -1;

  // For each combination of rows + cols that can fit the number of rectangles,
  // place them and see the area.
  if (aspectRatio !== undefined) {
    for (let cols = startCols; cols > 0; cols += colDelta) {
      const rows = Math.ceil(numRects / cols);
      const hScale = containerWidth / (cols * aspectRatio);
      const vScale = containerHeight / rows;
      let width;
      let height;
      // Determine which axis is the constraint.
      if (hScale <= vScale) {
        width = containerWidth / cols;
        height = width / aspectRatio;
      } else {
        height = containerHeight / rows;
        width = height * aspectRatio;
      }
      const area = width * height;
      if (area > best.area) {
        best = { area, width, height, rows, cols };
      }
    }
  }
  return best;
};

export const getTileSizesWithColConstraint = ({
  parentWidth,
  parentHeight,
  count,
  maxCount,
  aspectRatio,
}: GetTileSizes) => {
  let defaultWidth = 0;
  let defaultHeight = 0;
  let lastPageWidth = 0;
  let lastPageHeight = 0;
  let isLastPageDifferentFromFirstPage = false;
  let tilesInFirstPage = 0;
  let tilesinLastPage = 0;
  const cols = Math.min(
    Math.ceil(Math.sqrt((count * (parentWidth / parentHeight)) / (aspectRatio.width / aspectRatio.height))),
    maxCount,
  );
  let width = parentWidth / cols;
  let height = width / (aspectRatio.width / aspectRatio.height);
  if (height > parentHeight) {
    height = parentHeight;
    width = height / (aspectRatio.height / aspectRatio.width);
  }
  const rows = Math.floor(parentHeight / height);
  defaultHeight = height;
  defaultWidth = width;
  tilesInFirstPage = Math.min(count, rows * cols);
  tilesinLastPage = count % (rows * cols);
  isLastPageDifferentFromFirstPage = tilesinLastPage > 0 && count > rows * cols;
  if (isLastPageDifferentFromFirstPage) {
    const cols = Math.min(
      Math.ceil(Math.sqrt((tilesinLastPage * (parentWidth / parentHeight)) / (aspectRatio.width / aspectRatio.height))),
      maxCount,
    );
    let width = parentWidth / cols;
    let height = width / (aspectRatio.width / aspectRatio.height);
    if (height > parentHeight) {
      height = parentHeight;
      width = height / (aspectRatio.height / aspectRatio.width);
    }
    lastPageHeight = height;
    lastPageWidth = width;
  }
  return {
    tilesInFirstPage,
    defaultWidth,
    defaultHeight,
    lastPageWidth,
    lastPageHeight,
    isLastPageDifferentFromFirstPage,
  };
};

export const getTileSizesWithPageConstraint = ({
  parentWidth,
  parentHeight,
  count,
  maxCount,
  aspectRatio,
}: GetTileSizes) => {
  let defaultWidth = 0;
  let defaultHeight = 0;
  let lastPageWidth = 0;
  let lastPageHeight = 0;
  let isLastPageDifferentFromFirstPage = false;
  let tilesInFirstPage = 0;
  let tilesinLastPage = 0;
  const { width: initialWidth, height: initialHeight } = largestRect(
    parentWidth,
    parentHeight,
    Math.min(count, maxCount),
    aspectRatio.width,
    aspectRatio.height,
  );
  defaultWidth = initialWidth;
  defaultHeight = initialHeight;
  tilesInFirstPage = Math.min(count, maxCount);
  tilesinLastPage = count % maxCount;
  isLastPageDifferentFromFirstPage = tilesinLastPage > 0 && count > maxCount;
  if (isLastPageDifferentFromFirstPage) {
    const { width: remWidth, height: remHeight } = largestRect(
      parentWidth,
      parentHeight,
      tilesinLastPage,
      aspectRatio.width,
      aspectRatio.height,
    );
    lastPageWidth = remWidth;
    lastPageHeight = remHeight;
  }
  return {
    tilesInFirstPage,
    defaultWidth,
    defaultHeight,
    lastPageWidth,
    lastPageHeight,
    isLastPageDifferentFromFirstPage,
  };
};

export const getTileSizesWithRowConstraint = ({
  parentWidth,
  parentHeight,
  count,
  maxCount,
  aspectRatio,
}: GetTileSizes) => {
  let defaultWidth = 0;
  let defaultHeight = 0;
  let lastPageWidth = 0;
  let lastPageHeight = 0;
  let isLastPageDifferentFromFirstPage = false;
  let tilesInFirstPage = 0;
  let tilesinLastPage = 0;
  const rows = Math.min(
    Math.ceil(Math.sqrt((count * (aspectRatio.width / aspectRatio.height)) / (parentWidth / parentHeight))),
    maxCount,
  );
  const height = parentHeight / rows;
  const width = height * (aspectRatio.width / aspectRatio.height);
  const cols = Math.floor(parentWidth / width);
  defaultWidth = width;
  defaultHeight = height;
  tilesInFirstPage = Math.min(count, rows * cols);
  tilesinLastPage = count % (rows * cols);
  isLastPageDifferentFromFirstPage = tilesinLastPage > 0 && count > rows * cols;
  if (isLastPageDifferentFromFirstPage) {
    const rows = Math.min(
      Math.ceil(Math.sqrt((tilesinLastPage * (aspectRatio.width / aspectRatio.height)) / (parentWidth / parentHeight))),
      maxCount,
    );
    const height = parentHeight / rows;
    const width = height * (aspectRatio.width / aspectRatio.height);
    lastPageHeight = height;
    lastPageWidth = width;
  }
  return {
    tilesInFirstPage,
    defaultWidth,
    defaultHeight,
    lastPageWidth,
    lastPageHeight,
    isLastPageDifferentFromFirstPage,
  };
};

export function calculateLayoutSizes({
  count,
  parentWidth,
  parentHeight,
  maxTileCount,
  maxRowCount,
  maxColCount,
  aspectRatio,
}: GetTileSizesInList) {
  let defaultWidth = 0;
  let defaultHeight = 0;
  let lastPageWidth = 0;
  let lastPageHeight = 0;
  let isLastPageDifferentFromFirstPage = false;
  let tilesInFirstPage = 0;

  if (count === 0) {
    // no tracks to show
    return {
      tilesInFirstPage,
      defaultWidth,
      defaultHeight,
      lastPageWidth,
      lastPageHeight,
      isLastPageDifferentFromFirstPage,
    };
  }

  if (maxTileCount) {
    ({
      tilesInFirstPage,
      defaultWidth,
      defaultHeight,
      lastPageWidth,
      lastPageHeight,
      isLastPageDifferentFromFirstPage,
    } = getTileSizesWithPageConstraint({
      parentWidth,
      parentHeight,
      count,
      maxCount: maxTileCount,
      aspectRatio,
    }));
  } else if (maxRowCount) {
    ({
      tilesInFirstPage,
      defaultWidth,
      defaultHeight,
      lastPageWidth,
      lastPageHeight,
      isLastPageDifferentFromFirstPage,
    } = getTileSizesWithRowConstraint({
      parentWidth,
      parentHeight,
      count,
      maxCount: maxRowCount,
      aspectRatio,
    }));
  } else if (maxColCount) {
    ({
      tilesInFirstPage,
      defaultWidth,
      defaultHeight,
      lastPageWidth,
      lastPageHeight,
      isLastPageDifferentFromFirstPage,
    } = getTileSizesWithColConstraint({
      parentWidth,
      parentHeight,
      count,
      maxCount: maxColCount,
      aspectRatio,
    }));
  } else {
    const { width, height } = largestRect(parentWidth, parentHeight, count, aspectRatio.width, aspectRatio.height);
    defaultWidth = width;
    defaultHeight = height;
    tilesInFirstPage = count;
  }
  return {
    tilesInFirstPage,
    defaultWidth,
    defaultHeight,
    lastPageWidth,
    lastPageHeight,
    isLastPageDifferentFromFirstPage,
  };
}

/**
 * given list of peers and all tracks in the room, get a list of tile objects to show in the UI
 * @param peers
 * @param tracks
 * @param includeScreenShareForPeer - fn will be called to check whether to include screenShare for the peer in returned tiles
 * @param filterNonPublishingPeers - by default a peer with no tracks won't be counted towards final tiles
 */
export const getVideoTracksFromPeers = (
  peers: HMSPeer[],
  tracks: Record<HMSTrackID, HMSTrack>,
  includeScreenShareForPeer: (peer: HMSPeer) => boolean,
  filterNonPublishingPeers = true,
) => {
  if (!peers || !tracks || !includeScreenShareForPeer) {
    return [];
  }
  const peerTiles: TrackWithPeer[] = [];
  for (const peer of peers) {
    const onlyAudioTrack = peer.videoTrack === undefined && peer.audioTrack && tracks[peer.audioTrack];
    if (onlyAudioTrack) {
      peerTiles.push({ peer: peer });
    } else if (peer.videoTrack && tracks[peer.videoTrack]) {
      peerTiles.push({ track: tracks[peer.videoTrack] as HMSVideoTrack, peer: peer });
    } else if (!filterNonPublishingPeers) {
      peerTiles.push({ peer: peer });
    }
    // Handle video tracks in auxiliary tracks as well.
    if (peer.auxiliaryTracks.length > 0) {
      peer.auxiliaryTracks.forEach(trackId => {
        const track = tracks[trackId];
        if (track?.type === 'video' && track?.source === 'regular') {
          peerTiles.push({ track, peer });
        }
      });
    }
    if (includeScreenShareForPeer(peer) && peer.auxiliaryTracks.length > 0) {
      const screenShareTrackID = peer.auxiliaryTracks.find(trackID => {
        const track = tracks[trackID];
        return track?.type === 'video' && track?.source === 'screen';
      });
      // Don't show tile if screenshare only has audio
      if (screenShareTrackID) {
        peerTiles.push({ track: tracks[screenShareTrackID] as HMSScreenVideoTrack, peer: peer });
      }
    }
  }
  return peerTiles;
};

export const getClosestLayer = ({
  layerDefinitions,
  width,
  height,
}: {
  layerDefinitions: HMSSimulcastLayerDefinition[];
  width: number;
  height: number;
}): HMSPreferredSimulcastLayer => {
  let diff = Number.MAX_VALUE;
  let closestLayer: HMSPreferredSimulcastLayer | undefined = undefined;
  for (const { resolution, layer } of layerDefinitions) {
    const currDiff = Math.abs(width - (resolution.width || 0)) + Math.abs(height - (resolution.height || 0));
    if (currDiff < diff) {
      diff = currDiff;
      closestLayer = layer;
    }
  }
  return closestLayer!;
};

function findBestFitLayout({
  containerHeight,
  containerWidth,
  numTiles: n,
  aspectRatio,
}: {
  containerHeight: number;
  containerWidth: number;
  numTiles: number;
  aspectRatio: number;
}) {
  let result = { rows: 0, cols: 0, height: 0, width: 0 };
  if (n <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return result;
  }
  aspectRatio = aspectRatio || 1; // if not passed assume square
  let bestArea = 0; // area = tileWidth * tileHeight

  // brute force from 1 column(and n rows) to n columns(and 1 row)
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    // now that we have number of rows and columns, there are two ways to stack the tiles,
    // - to use the full width(dividing the width evenly between cols)
    // - to use the full height(dividing the height evenly between rows)
    // we'll try with first, and if it's not possible we'll go with second

    // tile width and height if we use the full container width
    let width = Math.floor(containerWidth / cols);
    let height = Math.floor(width / aspectRatio);

    // max height possible is when the total height is divided equally between the rows
    const maxHeightPossible = Math.floor(containerHeight / rows);
    if (height > maxHeightPossible) {
      // using full width is not possible for given number of columns, use full height instead
      height = maxHeightPossible;
      width = Math.floor(maxHeightPossible * aspectRatio);
    }
    const tileArea = width * height;
    if (tileArea > bestArea) {
      bestArea = tileArea;
      result = { rows, cols, height, width };
    }
  }

  return result;
}

export const calculateLayout = ({
  parentWidth,
  parentHeight,
  aspectRatio,
  tiles,
  maxTileCount,
}: {
  parentWidth: number;
  parentHeight: number;
  aspectRatio: number;
  tiles: number;
  maxTileCount: number;
}) => {
  let lastPageRows = 0;
  let lastPageCols = 0;
  let lastPageWidth = 0;
  let lastPageHeight = 0;
  const tilesPerPage = Math.min(tiles, maxTileCount);
  const { rows, cols, height, width } = findBestFitLayout({
    containerWidth: parentWidth,
    containerHeight: parentHeight,
    aspectRatio,
    numTiles: tilesPerPage,
  });
  const tilesForlastPage = tiles % (rows * cols);
  if (tilesForlastPage > 0) {
    const result = findBestFitLayout({
      containerWidth: parentWidth,
      containerHeight: parentHeight,
      aspectRatio,
      numTiles: tilesPerPage,
    });
    lastPageRows = result.rows;
    lastPageCols = result.cols;
    lastPageWidth = result.width;
    lastPageHeight = result.height;
  }
  return {
    defaultWidth: width,
    defaultHeight: height,
    rows,
    cols,
    lastPageWidth,
    lastPageHeight,
    lastPageCols,
    lastPageRows,
  };
};

export const chunkElementsWithLayout = <T>({
  elements,
  ...rest
}: {
  parentWidth: number;
  parentHeight: number;
  aspectRatio: number;
  tiles: number;
  maxTileCount: number;
  elements: T[];
}): {
  chunkedTracksWithPeer: (T & { width: number; height: number })[][];
  rows: number;
  cols: number;
  lastPageRows: number;
  lastPageCols: number;
} => {
  const { rows, cols, lastPageRows, lastPageCols, lastPageWidth, lastPageHeight, defaultWidth, defaultHeight } =
    calculateLayout(rest);
  const chunks: T[][] = chunk<T>(elements, rows * cols, rows * cols >= rest.tiles);
  return {
    chunkedTracksWithPeer: chunks.map((ch, page) =>
      ch.map(element => {
        const isLastPage: boolean = page === chunks.length - 1;
        const width = (isLastPage ? lastPageWidth : 0) || defaultWidth;
        const height = (isLastPage ? lastPageHeight : 0) || defaultHeight;
        return { ...element, height, width };
      }),
    ),
    rows,
    cols,
    lastPageRows,
    lastPageCols,
  };
};
