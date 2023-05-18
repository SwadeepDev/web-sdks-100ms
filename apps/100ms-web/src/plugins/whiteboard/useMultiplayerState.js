// @ts-check
import { useCallback, useEffect, useRef, useState } from "react";
import { selectDidIJoinWithin, useHMSStore } from "@100mslive/react-sdk";
import { provider as room } from "./PusherCommunicationProvider";
import { WhiteboardEvents as Events } from "./WhiteboardEvents";
import { useWhiteboardMetadata } from "./useWhiteboardMetadata";

export const useWhiteboardState = () => {
  const { amIWhiteboardOwner } = useWhiteboardMetadata();
  const shouldRequestState = useHMSStore(selectDidIJoinWithin(850));

  return { shouldRequestState, amIWhiteboardOwner };
};

/**
 * Ref: https://github.com/tldraw/tldraw/blob/main/apps/www/hooks/useMultiplayerState.ts
 */
export function useMultiplayerState(roomId) {
  const [app, setApp] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const { amIWhiteboardOwner, shouldRequestState } = useWhiteboardState();

  /**
   * Stores current state(shapes, bindings, [assets]) of the whiteboard
   */
  const rLiveShapes = useRef(new Map());
  const rLiveBindings = useRef(new Map());
  const rLiveAssets = useRef(new Map());

  const getCurrentState = useCallback(() => {
    return {
      shapes: rLiveShapes.current
        ? Object.fromEntries(rLiveShapes.current)
        : {},
      bindings: rLiveBindings.current
        ? Object.fromEntries(rLiveBindings.current)
        : {},
      assets: rLiveAssets.current
        ? Object.fromEntries(rLiveAssets.current)
        : {},
    };
  }, []);

  const sendCurrentState = useCallback(() => {
    if (amIWhiteboardOwner && isReady) {
      room.broadcastEvent(Events.CURRENT_STATE, getCurrentState());
    }
  }, [amIWhiteboardOwner, isReady, getCurrentState]);

  const updateLocalState = useCallback(
    ({ shapes, bindings, assets, merge = true }) => {
      if (!(shapes && bindings && assets)) return;

      if (merge) {
        const lShapes = rLiveShapes.current;
        const lBindings = rLiveBindings.current;
        const lAssets = rLiveAssets.current;

        if (!(lShapes && lBindings && lAssets)) return;
        if (shapes) {
          Object.entries(shapes).forEach(([id, shape]) => {
            if (!shape) {
              lShapes.delete(id);
            } else {
              lShapes.set(shape.id, shape);
            }
          });
        }
        if (bindings) {
          Object.entries(bindings).forEach(([id, binding]) => {
            if (!binding) {
              lBindings.delete(id);
            } else {
              lBindings.set(binding.id, binding);
            }
          });
        }
        if (assets) {
          Object.entries(assets).forEach(([id, asset]) => {
            if (!asset) {
              lAssets.delete(id);
            } else {
              lAssets.set(asset.id, asset);
            }
          });
        }
      } else {
        rLiveShapes.current = new Map(Object.entries(shapes));
        rLiveBindings.current = new Map(Object.entries(bindings));
        rLiveAssets.current = new Map(Object.entries(assets));
      }
    },
    []
  );

  const applyStateToBoard = useCallback(
    state => {
      console.log("assets ", state.assets);
      app === null || app === void 0
        ? void 0
        : app.replacePageContent(state.shapes, state.bindings, state.assets);
    },
    [app]
  );

  const addAssets = useCallback(assets => {
    if (!assets) return;
    updateLocalState({
      shapes: {},
      bindings: {},
      assets,
      merge: false,
    });

    applyStateToBoard(getCurrentState());
    sendCurrentState();
  }, []);
  const handleChanges = useCallback(
    state => {
      if (!state) {
        return;
      }

      const { shapes, bindings, assets, eventName } = state;
      updateLocalState({
        shapes,
        bindings,
        assets,
        merge: eventName === Events.STATE_CHANGE,
      });
      applyStateToBoard(getCurrentState());
    },
    [applyStateToBoard, getCurrentState, updateLocalState]
  );

  const setupInitialState = useCallback(() => {
    if (!isReady) {
      return;
    }

    if (amIWhiteboardOwner) {
      // On board open, update the document with initial/stored content
      handleChanges(room.getStoredEvent(Events.CURRENT_STATE));
      // Send current state to other peers in the room currently
      sendCurrentState();
    } else if (shouldRequestState) {
      /**
       * Newly joined peers request the owner for current state
       * and update their boards when they receive it
       */
      room.broadcastEvent(Events.REQUEST_STATE);
    }
  }, [
    isReady,
    amIWhiteboardOwner,
    shouldRequestState,
    handleChanges,
    sendCurrentState,
  ]);

  // Callbacks --------------
  // Put the state into the window, for debugging.
  const onMount = useCallback(
    app => {
      app.loadRoom(roomId);
      app.pause(); // Turn off the app's own undo / redo stack
      // window.app = app;
      setApp(app);
    },
    [roomId]
  );

  // Update the live shapes when the app's shapes change.
  const onChangePage = useCallback(
    (_app, shapes, bindings, assets) => {
      updateLocalState({ shapes, bindings, assets });
      room.broadcastEvent(Events.STATE_CHANGE, { shapes, bindings, assets });

      /**
       * Tldraw thinks that the next update passed to replacePageContent after onChangePage is the own update triggered by onChangePage
       * and the replacePageContent doesn't have any effect if it is a valid update from remote.
       *
       * To overcome this replacePageContent locally onChangePage(not costly - returns from first line).
       *
       * Refer: https://github.com/tldraw/tldraw/blob/main/packages/tldraw/src/state/TldrawApp.ts#L684
       */
      applyStateToBoard(getCurrentState());
    },
    [updateLocalState, applyStateToBoard, getCurrentState]
  );

  // Handle presence updates when the user's pointer / selection changes
  // const onChangePresence = useCallback((app, user) => {
  //   updateMyPresence({ id: app.room?.userId, user });
  // }, [][updateMyPresence]);

  // Subscriptions and initial setup
  useEffect(() => {
    if (!app) return;
    const unsubs = [];

    let stillAlive = true;

    // Setup the document's storage and subscriptions
    function setupDocument() {
      // Subscribe to changes
      if (stillAlive) {
        unsubs.push(room.subscribe(Events.STATE_CHANGE, handleChanges));
        unsubs.push(room.subscribe(Events.CURRENT_STATE, handleChanges));

        // On request state(peer join), send whole current state to update the new peer's whiteboard
        unsubs.push(room.subscribe(Events.REQUEST_STATE, sendCurrentState));

        setIsReady(true);
      }
    }

    room.init(roomId);
    setupDocument();
    setupInitialState();

    return () => {
      stillAlive = false;
      unsubs.forEach(unsub => unsub());
    };
  }, [app, roomId, setupInitialState, sendCurrentState, handleChanges]);

  useEffect(() => {
    // Store last state on closing whitboard so that when the board is reopened the state could be fetched and reapplied
    const handleUnmount = () => {
      if (isReady && !shouldRequestState) {
        console.log("Whiteboard unmount storing", getCurrentState());
        room.storeEvent(Events.CURRENT_STATE, getCurrentState());
      }
    };

    return handleUnmount;
  }, [isReady, shouldRequestState, getCurrentState]);

  return { onMount, onChangePage, addAssets };
}
