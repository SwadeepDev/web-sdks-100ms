import React, { useCallback } from 'react';
import { selectLocalPeerName, selectSessionStore, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { Button } from '../../../Button';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { SESSION_STORE_KEY } from '../../common/constants';

export const ChatPaused = () => {
  const hmsActions = useHMSActions();
  const { elements } = useRoomLayoutConferencingScreen();
  const can_disable_chat = !!elements?.chat?.real_time_controls?.can_disable_chat;
  const { enabled: isChatEnabled = true, updatedBy: chatStateUpdatedBy = '' } =
    useHMSStore(selectSessionStore(SESSION_STORE_KEY.CHAT_STATE)) || {};
  const localPeerName = useHMSStore(selectLocalPeerName);

  const unPauseChat = useCallback(
    async () =>
      await hmsActions.sessionStore.set(SESSION_STORE_KEY.CHAT_STATE, {
        enabled: true,
        updatedBy: localPeerName,
      }),
    [hmsActions, localPeerName],
  );

  return isChatEnabled ? null : (
    <Flex
      align="center"
      justify="between"
      css={{ borderRadius: '$1', bg: '$surface_default', p: '$4 $4 $4 $8', w: '100%' }}
    >
      <Box>
        <Text variant="sm" css={{ fontWeight: '$semiBold', color: '$on_surface_high' }}>
          Chat paused
        </Text>
        <Text
          variant="xs"
          css={{ color: '$on_surface_medium', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          Chat has been paused by {chatStateUpdatedBy}
        </Text>
      </Box>
      {can_disable_chat ? (
        <Button css={{ fontWeight: '$semiBold', fontSize: '$sm', borderRadius: '$2' }} onClick={unPauseChat}>
          Resume
        </Button>
      ) : (
        <></>
      )}
    </Flex>
  );
};

export const ChatBlocked = () => {
  return (
    <Flex
      align="center"
      justify="between"
      css={{ borderRadius: '$1', bg: '$surface_default', p: '$4 $4 $4 $8', w: '100%' }}
    >
      <Text variant="sm" css={{ color: '$on_surface_medium', textAlign: 'center', w: '100%' }}>
        You've been blocked from sending messages
      </Text>
    </Flex>
  );
};
