import React from 'react';
import { HMSPeer, selectLocalPeerID, useHMSStore, useParticipants } from '@100mslive/react-sdk';
import UseParticipantsDocs from './UseParticipants.mdx';
import { Avatar } from '../Avatar';
import { StoryHMSProviderWrapper } from '../common/HMSProviderWrapper';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';

const VirtualizedParticipants = ({ participants }: { participants: HMSPeer[] }) => {
  const localPeerId = useHMSStore(selectLocalPeerID);
  return (
    <Flex css={{ flexWrap: 'wrap' }}>
      {participants.map(participant => (
        <Participant key={participant.id} peer={participant} isLocal={participant.id === localPeerId} />
      ))}
    </Flex>
  );
};

const Participant = ({ peer, isLocal = false }: { peer: HMSPeer; isLocal?: boolean }) => {
  return (
    <Flex css={{ w: '100%', py: '$4', pr: '$10' }} align="center">
      <Avatar
        name={peer.name}
        css={{
          position: 'unset',
          transform: 'unset',
          mr: '$8',
          fontSize: '$sm',
          size: '$12',
          p: '$4',
        }}
      />
      <Flex direction="column" css={{ flex: '1 1 0' }}>
        <Text variant="md" css={{ fontWeight: '$semiBold' }}>
          {isLocal ? 'You' : peer.name}
        </Text>
        <Text variant="sub2">{peer.roleName}</Text>
      </Flex>
    </Flex>
  );
};

const UseParticipants = () => {
  const { isConnected, participants, peerCount } = useParticipants();

  return (
    <Box>
      <Text css={{ mb: '$4' }}>{peerCount} Participants</Text>
      <VirtualizedParticipants participants={participants} />
    </Box>
  );
};

const Template = () => {
 return (
  <StoryHMSProviderWrapper>
    <UseParticipants />
  </StoryHMSProviderWrapper>
 );
}

const Participants = {
  title: 'Hooks/useParticipants',
  component: Template,
  parameters: {
    docs: {
      page: UseParticipantsDocs,
    },
  },
};

export default Participants;

export const UseParticipantsHook = Template.bind({});
UseParticipantsHook.storyName = 'useParticipants';
