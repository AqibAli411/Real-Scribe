import * as React from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { Step } from "@tiptap/pm/transform";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";
import "@/components/tiptap-node/heading-node/heading-node.scss";

// --- Tiptap Node ---
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
// Add these imports back (they were in old version):
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";

import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

import { useWebSocket } from "../../../../../context/useWebSocketContext";
import { getApiUrl } from "../../../../../utils/api";

// Debounce helper with dynamic delay (network-adaptive).
function usePublishDebounce(callback, getDelay) {
  const timeoutRef = React.useRef(null);
  const callbackRef = React.useRef(callback);

  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  React.useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return React.useMemo(
    () =>
      (...args) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        const delay = Number(getDelay?.() ?? 200);
        timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
      },
    [getDelay],
  );
}



// Simplified toolbar - removed some heavy components
const MainToolbarContent = React.memo(({ onLinkClick, isMobile }) => (
  <>
    <Spacer />
    <ToolbarGroup>
      <UndoRedoButton action="undo" />
      <UndoRedoButton action="redo" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
      <ListDropdownMenu
        types={["bulletList", "orderedList"]}
        portal={isMobile}
      />
      <BlockquoteButton />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <MarkButton type="bold" />
      <MarkButton type="italic" />
      <MarkButton type="strike" />
      <MarkButton type="code" />
      {!isMobile && <ColorHighlightPopover />}
      {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <TextAlignButton align="left" />
      <TextAlignButton align="center" />
      <TextAlignButton align="right" />
    </ToolbarGroup>
    <Spacer />
  </>
));

const MobileToolbarContent = React.memo(({ type, onBack }) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>
    <ToolbarSeparator />
    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
));

function SimpleEditor({ roomId, userId, name }) {
  const sameUser = (leftId, rightId) =>
    String(leftId ?? "") === String(rightId ?? "");

  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = React.useState("main");

  // Core refs
  const editorRef = React.useRef(null);
  const isMountedRef = React.useRef(false);
  const isApplyingRemoteRef = React.useRef(false);
  const requiresSnapshotRef = React.useRef(false);
  const pendingPatchStepsRef = React.useRef([]);
  const networkProfileRef = React.useRef({
    patchDelay: 120,
    snapshotDelay: 1800,
  });
  const lastPublishedContentRef = React.useRef("");
  const { connected, isReady, subscribe, unsubscribe, publish } =
    useWebSocket();

  // WebSocket message handler with typing protection
  const onWrite = React.useCallback(
    (message) => {
      if (!isMountedRef.current || !editorRef.current) {
        return;
      }

      try {
        const { type, payload, userId: userWhoText } = JSON.parse(message.body);
        if (sameUser(userId, userWhoText)) return;

        if (type === "text_patch" && Array.isArray(payload?.steps) && payload.steps.length) {
          const editor = editorRef.current;
          if (!editor?.state?.tr) return;

          isApplyingRemoteRef.current = true;
          let tr = editor.state.tr;
          let appliedAnyStep = false;

          for (const stepJSON of payload.steps) {
            try {
              const step = Step.fromJSON(editor.state.schema, stepJSON);
              tr = tr.step(step);
              appliedAnyStep = true;
            } catch (stepError) {
              // Step desync can happen after packet loss/out-of-order messages.
              requiresSnapshotRef.current = true;
              console.warn("Skipping invalid remote text step:", stepError);
              break;
            }
          }

          if (appliedAnyStep && tr.docChanged) {
            editor.view.dispatch(tr);
            lastPublishedContentRef.current = JSON.stringify(editor.getJSON());
          }
          isApplyingRemoteRef.current = false;
          return;
        }

        if (type !== "text_update" || !payload?.content) {
          return;
        }

        if (!requiresSnapshotRef.current) {
          return;
        }

        const newContent = payload.content;
        const newContentStr = JSON.stringify(newContent);
        if (newContentStr === lastPublishedContentRef.current) return;

        isApplyingRemoteRef.current = true;
        const { from, to } = editorRef.current.state.selection;
        editorRef.current.commands.setContent(newContent, false);
        requestAnimationFrame(() => {
          if (editorRef.current && isMountedRef.current) {
            const docSize = editorRef.current.state.doc.content.size;
            if (from <= docSize && to <= docSize) {
              editorRef.current.commands.setTextSelection({ from, to });
            }
          }
          requiresSnapshotRef.current = false;
          isApplyingRemoteRef.current = false;
        });
      } catch (error) {
        console.error("WebSocket update error:", error);
        isApplyingRemoteRef.current = false;
      }
    },
    [userId],
  );

  React.useEffect(() => {
    if (!isReady) return;

    const topic = `/topic/write/room.${roomId}`;

    subscribe(topic, onWrite);

    return () => {
      unsubscribe(topic);
    };
  }, [isReady, roomId, subscribe, unsubscribe, onWrite]);

  React.useEffect(() => {
    const updateProfile = () => {
      const conn = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
      if (!conn) {
        networkProfileRef.current = { patchDelay: 120, snapshotDelay: 1800 };
        return;
      }

      const effectiveType = conn.effectiveType || "";
      const rtt = Number(conn.rtt || 0);
      const downlink = Number(conn.downlink || 0);
      const lowNetwork =
        Boolean(conn.saveData) ||
        effectiveType === "2g" ||
        effectiveType === "slow-2g" ||
        rtt >= 250 ||
        (downlink > 0 && downlink < 1.2);

      if (lowNetwork) {
        networkProfileRef.current = { patchDelay: 360, snapshotDelay: 4200 };
        return;
      }

      const mediumNetwork =
        effectiveType === "3g" || rtt >= 140 || (downlink > 0 && downlink < 3.5);
      if (mediumNetwork) {
        networkProfileRef.current = { patchDelay: 230, snapshotDelay: 3000 };
        return;
      }

      networkProfileRef.current = { patchDelay: 120, snapshotDelay: 1800 };
    };

    updateProfile();
    const conn = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
    if (!conn?.addEventListener) return;
    conn.addEventListener("change", updateProfile);
    return () => conn.removeEventListener("change", updateProfile);
  }, []);

  const debouncedPublishPatch = usePublishDebounce(
    React.useCallback(() => {
      if (
        !connected ||
        !isMountedRef.current ||
        isApplyingRemoteRef.current ||
        !pendingPatchStepsRef.current.length
      ) {
        return;
      }

      const steps = pendingPatchStepsRef.current.splice(0, pendingPatchStepsRef.current.length);
      publish(`/app/room/${roomId}/msg`, {
        type: "text_patch",
        userId,
        roomId,
        payload: { steps },
      });
    }, [connected, roomId, userId, publish]),
    () => networkProfileRef.current.patchDelay,
  );

  // Lower frequency full snapshots for persistence/fallback sync.
  const debouncedPublishSnapshot = usePublishDebounce(
    React.useCallback(
      () => {
        if (
          !connected ||
          !isMountedRef.current ||
          isApplyingRemoteRef.current ||
          !editorRef.current
        ) {
          return;
        }

        const content = editorRef.current.getJSON();
        const contentStr = JSON.stringify(content);
        if (contentStr === lastPublishedContentRef.current) {
          return;
        }

        try {
          publish(`/app/room/${roomId}/msg`, {
            type: "text_update",
            userId,
            roomId,
            payload: { content, sync: true },
          });
          lastPublishedContentRef.current = contentStr;
        } catch (error) {
          console.error("Publish error:", error);
        }
      },
      [connected, roomId, userId, publish],
    ),
    () => networkProfileRef.current.snapshotDelay,
  );

  // Editor with minimal extensions for better performance
  const editor = useEditor(
    {
      onUpdate() {
        if (!isApplyingRemoteRef.current && isMountedRef.current) {
          debouncedPublishSnapshot();
        }
      },
      onTransaction({ transaction }) {
        if (!isMountedRef.current || isApplyingRemoteRef.current || !transaction.docChanged) {
          return;
        }

        if (transaction.steps?.length) {
          const serialized = transaction.steps.map((step) => step.toJSON());
          pendingPatchStepsRef.current.push(...serialized);
          debouncedPublishPatch();
        }
      },
      onCreate({ editor }) {
        editorRef.current = editor;
      },
      onDestroy() {
        editorRef.current = null;
      },
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: {
          class: "simple-editor",
          "aria-label": "Main content area, start typing to enter text.",
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
        },
      },
      extensions: [
        // Minimal extension set for better performance
        StarterKit.configure({
          horizontalRule: false,
          history: {
            depth: 50, // Reduced history depth
            newGroupDelay: 1000,
          },
          link: {
            openOnClick: false,
          },
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
          alignments: ["left", "center", "right"], // Removed justify for performance
        }),
        TaskList,
        TaskItem.configure({ nested: false }), // Disabled nesting for performance
        Highlight.configure({ multicolor: true }),
        Typography,
        HorizontalRule,
      ],
    },
    [],
  );

  // Event handlers
  const handleHighlighterClick = React.useCallback(
    () => setMobileView("highlighter"),
    [],
  );
  const handleLinkClick = React.useCallback(() => setMobileView("link"), []);
  const handleBackClick = React.useCallback(() => setMobileView("main"), []);

  // Effects
  React.useEffect(() => {
    isMountedRef.current = true;
    async function fetchText() {
      const apiUrl = getApiUrl();
      if (!roomId) {
        console.error("Cannot fetch text: roomId is not configured");
        return;
      }

      const textUrl = `${apiUrl}/api/text/latest/${roomId}`;

      try {
        const response = await fetch(textUrl);
        if (!response.ok) return;

        const data = await response.json();
        if (!editorRef.current) return;
        if (data.exists && data.content) {
          editorRef.current.commands.setContent(data.content.content, false);
          lastPublishedContentRef.current = JSON.stringify(data.content.content);
        } else {
          editorRef.current.commands.setContent(
            {
              type: "doc",
              content: [
                {
                  type: "heading",
                  attrs: {
                    textAlign: null,
                    level: 4,
                    color: null,
                    href: null,
                    target: null,
                    src: null,
                    title: null,
                    alt: null,
                    checked: false,
                    class: null,
                  },
                  content: [{ type: "text", text: "Heading" }],
                },
              ],
            },
            false,
          );
          lastPublishedContentRef.current = JSON.stringify(editorRef.current.getJSON());
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchText();

    return () => {
      isMountedRef.current = false;
    };
  }, [roomId]);

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  // Simplified toolbar styles
  const toolbarStyles = React.useMemo(
    () =>
      isMobile
        ? {
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
        }
        : {},
    [isMobile],
  );

  return (
    <EditorContext.Provider value={{ editor }}>
      <Toolbar style={toolbarStyles}>
        {mobileView === "main" ? (
          <MainToolbarContent
            onHighlighterClick={handleHighlighterClick}
            onLinkClick={handleLinkClick}
            isMobile={isMobile}
          />
        ) : (
          <MobileToolbarContent
            type={mobileView === "highlighter" ? "highlighter" : "link"}
            onBack={handleBackClick}
          />
        )}
      </Toolbar>

      <EditorContent editor={editor} className="simple-editor-content" />
    </EditorContext.Provider>
  );
}

MainToolbarContent.displayName = "MainToolbarContent";
MobileToolbarContent.displayName = "MobileToolbarContent";

export default React.memo(SimpleEditor);
