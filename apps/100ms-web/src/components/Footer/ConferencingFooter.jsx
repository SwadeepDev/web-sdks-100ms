import React from "react";
import { HMSPlaylistType } from "@100mslive/react-sdk";
import { Flex, Footer as AppFooter } from "@100mslive/react-ui";
import { Playlist } from "../../components/Playlist/Playlist";
import { AudioVideoToggle } from "../AudioVideoToggle";
import { LeaveRoom } from "../LeaveRoom";
import MetaActions from "../MetaActions";
import { MoreSettings } from "../MoreSettings/MoreSettings";
import { ScreenshareToggle } from "../ScreenShare";
import { ChatToggle } from "./ChatToggle";
import { NoiseSuppression } from "../../plugins/NoiseSuppression";
import { VirtualBackground } from "../../plugins/VirtualBackground/VirtualBackground";
import { ToggleWhiteboard } from "../../plugins/whiteboard";
import { FeatureFlags } from "../../services/FeatureFlags";

const TranscriptionButton = React.lazy(() =>
  import("../../plugins/transcription")
);

// noinspection JSUnusedLocalSymbols
// const ScreenshareAudio = () => {
//   const {
//     amIScreenSharing,
//     screenShareVideoTrackId: video,
//     screenShareAudioTrackId: audio,
//     toggleScreenShare,
//   } = useScreenShare();
//   const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
//   const isAudioScreenshare = amIScreenSharing && !video && !!audio;
//   const [showModal, setShowModal] = useState(false);
//   if (!isAllowedToPublish.screen || !isScreenshareSupported()) {
//     return null;
//   }
//   return (
//     <Fragment>
//       <Tooltip
//         title={`${!isAudioScreenshare ? "Start" : "Stop"} audio sharing`}
//         key="shareAudio"
//       >
//         <IconButton
//           active={!isAudioScreenshare}
//           onClick={() => {
//             if (amIScreenSharing) {
//               toggleScreenShare();
//             } else {
//               setShowModal(true);
//             }
//           }}
//           data-testid="screenshare_audio"
//         >
//           <MusicIcon />
//         </IconButton>
//       </Tooltip>
//       {showModal && (
//         <ScreenShareHintModal onClose={() => setShowModal(false)} />
//       )}
//     </Fragment>
//   );
// };

export const ConferencingFooter = () => {
  return (
    <AppFooter.Root>
      <AppFooter.Left>
        {/*<ScreenshareAudio />*/}
        {/*<Playlist type={HMSPlaylistType.audio} />*/}
        <Playlist type={HMSPlaylistType.video} />
        {FeatureFlags.enableWhiteboard ? <ToggleWhiteboard /> : null}
        <VirtualBackground />
        <NoiseSuppression />
        <ScreenshareToggle />
        {FeatureFlags.enableTranscription && <TranscriptionButton />}
        <Flex
          align="center"
          css={{
            display: "none",
            "@md": {
              display: "flex",
            },
          }}
        >
          <MetaActions isMobile />
        </Flex>
      </AppFooter.Left>
      <AppFooter.Center>
        <AudioVideoToggle />

        {/*<PIPComponent />*/}
        <MoreSettings />
        <LeaveRoom />
        <Flex
          align="center"
          css={{ display: "none", "@md": { display: "flex" } }}
        >
          <ChatToggle />
        </Flex>
      </AppFooter.Center>
      <AppFooter.Right>
        <MetaActions />
        <ChatToggle />
      </AppFooter.Right>
    </AppFooter.Root>
  );
};
