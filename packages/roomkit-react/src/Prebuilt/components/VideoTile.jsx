import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import {
  selectAudioTrackByPeerID,
  selectHasPeerHandRaised,
  selectIsPeerAudioEnabled,
  selectLocalPeerID,
  selectPeerMetadata,
  selectPeerNameByID,
  selectSessionStore,
  selectTrackAudioByID,
  selectVideoTrackByID,
  selectVideoTrackByPeerID,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { BrbTileIcon, HandIcon, MicOffIcon } from '@100mslive/react-icons';
import TileConnection from './Connection/TileConnection';
import TileMenu, { isSameTile } from './TileMenu/TileMenu';
import { Avatar } from '../../Avatar';
import { Box, Flex } from '../../Layout';
import { VideoTileStats } from '../../Stats';
import { config as cssConfig, keyframes } from '../../Theme';
import { Video } from '../../Video';
import { StyledVideoTile } from '../../VideoTile';
import { getVideoTileLabel } from './peerTileUtils';
import { useSetAppDataByKey, useUISettings } from './AppData/useUISettings';
import { getAttributeBoxSize } from '../common/utils';
import { APP_DATA, SESSION_STORE_KEY, UI_SETTINGS } from '../common/constants';

const Tile = ({
  peerId,
  trackId,
  width,
  height,
  objectFit = 'cover',
  canMinimise = false,
  isDragabble = false,
  rootCSS = {},
  containerCSS = {},
  enableSpotlightingPeer = true,
  hideParticipantNameOnTile = false,
  roundedVideoTile = true,
  hideAudioMuteOnTile = false,
  hideMetadataOnTile = false,
}) => {
  const trackSelector = trackId ? selectVideoTrackByID(trackId) : selectVideoTrackByPeerID(peerId);
  const track = useHMSStore(trackSelector);
  const isMobile = useMedia(cssConfig.media.md);
  const peerName = useHMSStore(selectPeerNameByID(peerId));
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(peerId));
  const localPeerID = useHMSStore(selectLocalPeerID);
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);
  const mirrorLocalVideo = useUISettings(UI_SETTINGS.mirrorLocalVideo);
  const showStatsOnTiles = useUISettings(UI_SETTINGS.showStatsOnTiles);
  const isAudioMuted = !useHMSStore(selectIsPeerAudioEnabled(peerId));
  const isVideoMuted = !track?.enabled;
  const [isMouseHovered, setIsMouseHovered] = useState(false);
  const isVideoDegraded = track?.degraded;
  const isLocal = localPeerID === peerId;
  const [pinnedTrackId] = useSetAppDataByKey(APP_DATA.pinnedTrackId);
  const pinned = isSameTile({
    trackId: pinnedTrackId,
    videoTrackID: track?.id,
    audioTrackID: audioTrack?.id,
  });
  const spotlighted = useHMSStore(selectSessionStore(SESSION_STORE_KEY.SPOTLIGHT)) === peerId;
  const label = getVideoTileLabel({
    peerName,
    track,
    isLocal,
  });
  const onHoverHandler = useCallback(event => {
    setIsMouseHovered(event.type === 'mouseenter');
  }, []);

  const ref = useRef(null);
  const calculatedHeight = ref.current?.clientHeight || '';
  const calculatedWidth = ref.current?.clientWidth || '';

  const isTileBigEnoughToShowStats = calculatedHeight >= 180 && calculatedWidth >= 180;

  const avatarSize = useMemo(() => {
    if (!calculatedWidth || !calculatedHeight) {
      return undefined;
    }
    if (calculatedWidth <= 150 || calculatedHeight <= 150) {
      return 'small';
    } else if (calculatedWidth <= 300 || calculatedHeight <= 300) {
      return 'medium';
    }
    return 'large';
  }, [calculatedWidth, calculatedHeight]);

  return (
    <StyledVideoTile.Root
      ref={ref}
      css={{
        width,
        height,
        ...rootCSS,
      }}
      data-testid={`participant_tile_${peerName}`}
    >
      {peerName !== undefined ? (
        <StyledVideoTile.Container
          onMouseEnter={onHoverHandler}
          onMouseLeave={onHoverHandler}
          noRadius={!roundedVideoTile}
          css={containerCSS}
        >
          {showStatsOnTiles && isTileBigEnoughToShowStats ? (
            <VideoTileStats audioTrackID={audioTrack?.id} videoTrackID={track?.id} peerID={peerId} isLocal={isLocal} />
          ) : null}

          <Video
            trackId={track?.id}
            attach={isLocal ? undefined : !isAudioOnly}
            mirror={
              mirrorLocalVideo &&
              peerId === localPeerID &&
              track?.source === 'regular' &&
              track?.facingMode !== 'environment'
            }
            noRadius={!roundedVideoTile}
            data-testid="participant_video_tile"
            css={{
              objectFit,
              filter: isVideoDegraded ? 'blur($space$2)' : undefined,
              bg: 'transparent',
            }}
          />

          {isVideoMuted || (!isLocal && isAudioOnly) ? (
            <StyledVideoTile.AvatarContainer>
              <Avatar name={peerName || ''} data-testid="participant_avatar_icon" size={avatarSize} />
            </StyledVideoTile.AvatarContainer>
          ) : null}

          {!hideAudioMuteOnTile ? (
            isAudioMuted ? (
              <StyledVideoTile.AudioIndicator
                data-testid="participant_audio_mute_icon"
                size={getAttributeBoxSize(calculatedWidth, calculatedHeight)}
              >
                <MicOffIcon />
              </StyledVideoTile.AudioIndicator>
            ) : (
              <AudioLevel trackId={audioTrack?.id} />
            )
          ) : null}
          {isMouseHovered || (isDragabble && isMobile) ? (
            <TileMenu
              peerID={peerId}
              audioTrackID={audioTrack?.id}
              videoTrackID={track?.id}
              canMinimise={canMinimise}
              enableSpotlightingPeer={enableSpotlightingPeer}
            />
          ) : null}
          {!hideMetadataOnTile && <PeerMetadata peerId={peerId} height={calculatedHeight} width={calculatedWidth} />}

          <TileConnection
            hideLabel={hideParticipantNameOnTile}
            name={label}
            isTile
            peerId={peerId}
            width={width}
            pinned={pinned}
            spotlighted={spotlighted}
          />
        </StyledVideoTile.Container>
      ) : null}
    </StyledVideoTile.Root>
  );
};

const heightAnimation = value =>
  keyframes({
    '50%': {
      transform: `scale3d(1,${value},1)`,
    },
    '100%': {
      transform: `scale3d(1,1,1)`,
    },
  });

const AudioLevelIndicator = ({ trackId, value, delay }) => {
  const vanillaStore = useHMSVanillaStore();
  const ref = useRef();

  useEffect(() => {
    const unsubscribe = vanillaStore.subscribe(audioLevel => {
      if (ref.current) {
        ref.current.style['animation'] = `${heightAnimation(
          audioLevel ? value : 1,
        )} 0.3s cubic-bezier(0.61, 1, 0.88, 1) infinite ${delay}s`;
      }
    }, selectTrackAudioByID(trackId));
    return unsubscribe;
  }, [vanillaStore, trackId, value, delay]);
  return (
    <Box
      ref={ref}
      css={{
        w: 4,
        height: 6,
        r: 2,
        bg: '$on_primary_high',
      }}
    />
  );
};

export const AudioLevel = ({ trackId }) => {
  return (
    <StyledVideoTile.AudioIndicator>
      <Flex align="center" justify="center" css={{ gap: '$2' }}>
        {[3, 2, 3].map((v, i) => (
          <AudioLevelIndicator trackId={trackId} value={v} delay={i * 0.15} key={i} />
        ))}
      </Flex>
    </StyledVideoTile.AudioIndicator>
  );
};

const PeerMetadata = ({ peerId, height, width }) => {
  const metaData = useHMSStore(selectPeerMetadata(peerId));
  const isBRB = metaData?.isBRBOn || false;
  const isHandRaised = useHMSStore(selectHasPeerHandRaised(peerId));

  return (
    <Fragment>
      {isHandRaised ? (
        <StyledVideoTile.AttributeBox size={getAttributeBoxSize(width, height)} data-testid="raiseHand_icon_onTile">
          <HandIcon width={24} height={24} />
        </StyledVideoTile.AttributeBox>
      ) : null}
      {isBRB ? (
        <StyledVideoTile.AttributeBox size={getAttributeBoxSize(width, height)} data-testid="brb_icon_onTile">
          <BrbTileIcon width={22} height={22} />
        </StyledVideoTile.AttributeBox>
      ) : null}
    </Fragment>
  );
};

const VideoTile = React.memo(Tile);

export default VideoTile;
