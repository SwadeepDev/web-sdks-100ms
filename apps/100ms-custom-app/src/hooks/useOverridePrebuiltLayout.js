import { useMedia } from 'react-use';
import { config as cssConfig } from '@100mslive/roomkit-react';
import { useSearchParam } from './useSearchParam';

export const QUERY_PARAM_SKIP_PREVIEW = 'skip_preview';
export const QUERY_PARAM_SKIP_PREVIEW_HEADFUL = 'skip_preview_headful';

export const useOverridePrebuiltLayout = () => {
  // way to skip preview for automated tests, beam recording and streaming
  const beamInToken = useSearchParam('token') === 'beam_recording'; // old format to remove
  // use this field to join directly for quick testing while in local
  const directJoinHeadfulFromEnv =
    process.env.REACT_APP_HEADLESS_JOIN === 'true';
  const directJoinHeadful =
    useSearchParam(QUERY_PARAM_SKIP_PREVIEW_HEADFUL) === 'true' ||
    directJoinHeadfulFromEnv;
  let skipPreview = useSearchParam(QUERY_PARAM_SKIP_PREVIEW) === 'true';
  const isMobile = useMedia(cssConfig.media.md);

  let overrideLayout = undefined;

  if (skipPreview || beamInToken) {
    overrideLayout = {
      preview: null,
    };
    overrideLayout.conferencing = {
      default: {
        hideSections: ['footer', 'header'],
        elements: {
          video_tile_layout: {
            grid: {
              enable_local_tile_inset: false,
              hide_participant_name_on_tile: true,
              rounded_video_tile: !isMobile,
              hide_audio_mute_on_tile: true,
              video_object_fit: isMobile ? 'cover' : 'contain',
              edge_to_edge: true,
              hide_metadata_on_tile: true,
            },
          },
        },
      },
    };
  }

  if (directJoinHeadful) {
    overrideLayout = {
      preview: null,
    };
  }

  return {
    overrideLayout,
    isHeadless: skipPreview || beamInToken || directJoinHeadful,
  };
};