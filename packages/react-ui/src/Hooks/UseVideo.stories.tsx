import React from 'react';
import { ComponentStory } from '@storybook/react';
import { useVideo } from '@100mslive/react-sdk';
import UseVideoDocs from './UseVideo.mdx';
import { StyledVideo } from '../Video/Video';

const VideoHook: ComponentStory<typeof StyledVideo> = () => {
  const { videoRef } = useVideo({
    trackId: '1',
  });

  return <StyledVideo css={{ bg: '$backgroundDark', maxWidth: '800px' }} ref={videoRef} autoPlay muted />;
};

const VideoStories = {
  title: 'Hooks/useVideo',
  component: VideoHook,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  parameters: {
    docs: {
      page: UseVideoDocs,
    },
  },
};

export default VideoStories;

export const UseVideoHook = VideoHook.bind({});
UseVideoHook.storyName = 'useVideo';
