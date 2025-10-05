import * as React from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

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
import { useWindowSize } from "@/hooks/use-window-size";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

import { useWebSocket } from "../../../../../context/useWebSocketContext";

// Simplified debounce for publishing only
function usePublishDebounce(callback, delay) {
  const timeoutRef = React.useRef(null);
  const callbackRef = React.useRef(callback);

  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return React.useMemo(
    () =>
      (...args) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(
          () => callbackRef.current(...args),
          delay,
        );
      },
    [delay],
  );
}

// Simplified toolbar - removed some heavy components
const MainToolbarContent = React.memo(
  ({ onHighlighterClick, onLinkClick, isMobile }) => (
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
  ),
);

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
  const isMobile = useIsMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = React.useState("main");

  // Core refs
  const editorRef = React.useRef(null);
  const isMountedRef = React.useRef(false);
  const isUpdatingFromWSRef = React.useRef(false);
  const lastPublishedContentRef = React.useRef("");
  const { connected, isReady, subscribe, unsubscribe, publish } =
    useWebSocket();

  // WebSocket message handler with typing protection
  const onWrite = React.useCallback(
    (message) => {
      if (
        !isMountedRef.current ||
        !editorRef.current ||
        isUpdatingFromWSRef.current
      ) {
        return;
      }

      try {
        const { payload, userId: userWhoText } = JSON.parse(message.body);
        const newContent = payload.content;
        const newContentStr = JSON.stringify(newContent);

        if (Number(userId) === Number(userWhoText)) return;

        // Skip if content is the same
        if (newContentStr === lastPublishedContentRef.current) {
          return;
        }

        // Prevent feedback loop
        isUpdatingFromWSRef.current = true;

        // Store current cursor position
        const { from, to } = editorRef.current.state.selection;

        // Apply update without triggering onUpdate
        editorRef.current.commands.setContent(newContent, false);

        // Restore cursor if position is still valid
        requestAnimationFrame(() => {
          if (editorRef.current && isMountedRef.current) {
            const docSize = editorRef.current.state.doc.content.size;
            if (from <= docSize && to <= docSize) {
              editorRef.current.commands.setTextSelection({ from, to });
            }
          }
          isUpdatingFromWSRef.current = false;
        });
      } catch (error) {
        console.error("WebSocket update error:", error);
        isUpdatingFromWSRef.current = false;
      }
    },
    [userId],
  );

  // WebSocket connection
  // const { client, connected } = useWebSocket(
  //   [{ topic: `/topic/write/room.${roomId}`, handler: onWrite }],
  //   {
  //     id: userId,
  //     name,
  //   },
  // );
  React.useEffect(() => {
    if (!isReady) return;

    const topic = `/topic/write/room.${roomId}`;

    subscribe(topic, onWrite);

    return () => {
      unsubscribe(topic);
    };
  }, [isReady, roomId, subscribe, unsubscribe, onWrite]);

  // Publish with longer debounce to reduce network calls
  const debouncedPublish = usePublishDebounce(
    React.useCallback(
      (content) => {
        if (
          !connected ||
          !isMountedRef.current ||
          isUpdatingFromWSRef.current
        ) {
          return;
        }

        const contentStr = JSON.stringify(content);
        if (contentStr === lastPublishedContentRef.current) {
          return;
        }

        try {
          // client.publish({
          //   destination: `/app/room/${roomId}/msg`,
          //   body: JSON.stringify({
          //     type: "text_update",
          //     userId,
          //     roomId,
          //     payload: { content },
          //   }),
          // });
          publish(`/app/room/${roomId}/msg`, {
            type: "text_update",
            userId,
            roomId,
            payload: { content },
          });
          lastPublishedContentRef.current = contentStr;
        } catch (error) {
          console.error("Publish error:", error);
        }
      },
      [connected, roomId, userId, publish],
    ),
    50, // Longer debounce to reduce conflicts
  );

  // Editor with minimal extensions for better performance
  const editor = useEditor(
    {
      onUpdate({ editor }) {
        if (!isUpdatingFromWSRef.current && isMountedRef.current) {
          // markUserTyping();
          debouncedPublish(editor.getJSON());
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
      try {
        const response = await fetch(
          `http://localhost:8080/api/text/latest/${roomId}`,
        );
        if (!response.ok) return;

        const data = await response.json();
        console.log(data);

        if (data.exists && data.content) {
          editorRef.current.commands.setContent(data.content.content, false);
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
