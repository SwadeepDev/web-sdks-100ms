import React, { useEffect, useState } from "react";
import { useVideoList } from "@100mslive/react-sdk";
import { getLeft, StyledVideoList, useTheme } from "@100mslive/react-ui";
import { Pagination } from "./Pagination";
import ScreenshareTile from "./ScreenshareTile";
import VideoTile from "./VideoTile";
import { useAppConfig } from "./AppData/useAppConfig";
import { useIsHeadless } from "./AppData/useUISettings";

const List = ({
  maxTileCount,
  peers,
  maxColCount,
  maxRowCount,
  includeScreenShareForPeer,
}) => {
  const { aspectRatio } = useTheme();
  const tileOffset = useAppConfig("headlessConfig", "tileOffset");
  const isHeadless = useIsHeadless();
  const { ref, pagesWithTiles, cols, lastPageCols } = useVideoList({
    peers,
    maxTileCount,
    maxColCount,
    maxRowCount,
    includeScreenShareForPeer,
    aspectRatio,
    offsetY: getOffset({ isHeadless, tileOffset }),
  });
  const [page, setPage] = useState(0);
  useEffect(() => {
    // currentPageIndex should not exceed pages length
    if (page >= pagesWithTiles.length) {
      setPage(0);
    }
  }, [pagesWithTiles.length, page]);
  return (
    <StyledVideoList.Root ref={ref}>
      <StyledVideoList.Container css={{ justifyContent: "center" }}>
        {pagesWithTiles && pagesWithTiles.length > 0
          ? pagesWithTiles.map((tiles, pageNo) => {
              const isLastPage =
                pagesWithTiles.length > 1 &&
                pageNo === pagesWithTiles.length - 1;
              return (
                <StyledVideoList.View
                  key={pageNo}
                  css={{
                    left: pageNo === page ? undefined : getLeft(pageNo, page),
                    transition: "left 0.3s ease-in-out",
                    w:
                      ((isLastPage ? lastPageCols : cols) || maxColCount) *
                      tiles[0].width,
                  }}
                >
                  {tiles.map(tile => {
                    if (tile.width === 0 || tile.height === 0) {
                      return null;
                    }
                    return tile.track?.source === "screen" ? (
                      <ScreenshareTile
                        key={tile.track.id}
                        width={tile.width}
                        height={tile.height}
                        peerId={tile.peer.id}
                      />
                    ) : (
                      <VideoTile
                        key={tile.track?.id || tile.peer.id}
                        width={tile.width}
                        height={tile.height}
                        peerId={tile.peer?.id}
                        trackId={tile.track?.id}
                        visible={pageNo === page}
                      />
                    );
                  })}
                </StyledVideoList.View>
              );
            })
          : null}
      </StyledVideoList.Container>
      {!isHeadless && pagesWithTiles.length > 1 ? (
        <Pagination
          page={page}
          setPage={setPage}
          numPages={pagesWithTiles.length}
        />
      ) : null}
    </StyledVideoList.Root>
  );
};

const VideoList = React.memo(List);

const getOffset = ({ offset, isHeadless }) => {
  if (!isHeadless || typeof offset !== "number") {
    return 32;
  }
  return offset;
};

export default VideoList;
