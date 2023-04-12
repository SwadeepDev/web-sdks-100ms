import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePrevious } from "react-use";
import {
  HMSRoomState,
  selectAppData,
  selectIsConnectedToRoom,
  selectRoomState,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, Flex } from "@100mslive/react-ui";
import { ConferenceMainView } from "../layouts/mainView";
import { Footer } from "./Footer";
import FullPageProgress from "./FullPageProgress";
import { Header } from "./Header";
import { RoleChangeRequestModal } from "./RoleChangeRequestModal";
import { useIsHeadless } from "./AppData/useUISettings";
import { useNavigation } from "./hooks/useNavigation";
import { APP_DATA } from "../common/constants";

const Conference = () => {
  const navigate = useNavigation();
  const { roomId, role } = useParams();
  const isHeadless = useIsHeadless();
  const roomState = useHMSStore(selectRoomState);
  const prevState = usePrevious(roomState);
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();
  const [hideControls, setHideControls] = useState(false);
  const autoHideControlsAfter = useHMSStore(
    selectAppData(APP_DATA.autoHideControlsAfter)
  );

  useEffect(() => {
    let timeout = null;
    if (autoHideControlsAfter === null) {
      setHideControls(false);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setHideControls(true);
      }, autoHideControlsAfter);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [autoHideControlsAfter, hideControls]);

  useEffect(() => {
    const onPageClick = () => {
      setHideControls(false);
    };
    document.addEventListener("click", onPageClick);
    return () => {
      document.removeEventListener("click", onPageClick);
    };
  }, []);

  useEffect(() => {
    if (!roomId) {
      navigate(`/`);
      return;
    }
    if (
      !prevState &&
      !(
        roomState === HMSRoomState.Connecting ||
        roomState === HMSRoomState.Reconnecting ||
        isConnectedToRoom
      )
    ) {
      if (role) navigate(`/preview/${roomId || ""}/${role}`);
      else navigate(`/preview/${roomId || ""}`);
    }
  }, [isConnectedToRoom, prevState, roomState, navigate, role, roomId]);

  useEffect(() => {
    // beam doesn't need to store messages, saves on unnecessary store updates in large calls
    if (isHeadless) {
      hmsActions.ignoreMessageTypes(["chat"]);
    }
  }, [isHeadless, hmsActions]);

  if (!isConnectedToRoom) {
    return <FullPageProgress />;
  }

  return (
    <Flex css={{ size: "100%" }} direction="column">
      {!isHeadless && (
        <Box
          css={{
            h: "$18",
            transition: "transform 0.5s ease-out",
            "@md": {
              h: "$17",
              transform: hideControls ? "translateY(100%)" : "none",
            },
            "@ls": {
              transform: hideControls ? "translateY(100%)" : "none",
            },
          }}
          data-testid="header"
        >
          <Header />
        </Box>
      )}
      <Box
        css={{
          w: "100%",
          flex: "1 1 0",
          minHeight: 0,
          "@md": {
            flex: hideControls ? "0 0 100%" : "1 1 0",
          },
          "@ls": {
            flex: hideControls ? "0 0 100%" : "1 1 0",
          },
        }}
        data-testid="conferencing"
      >
        <ConferenceMainView />
      </Box>
      {!isHeadless && (
        <Box
          css={{
            flexShrink: 0,
            maxHeight: "$24",
            transition: "transform 0.3s ease-out",
            "@md": {
              maxHeight: "unset",
              transform: hideControls ? "translateY(100%)" : "none",
            },
            "@ls": {
              transform: hideControls ? "translateY(100%)" : "none",
            },
          }}
          data-testid="footer"
        >
          <Footer />
        </Box>
      )}
      <RoleChangeRequestModal />
    </Flex>
  );
};

export default Conference;
