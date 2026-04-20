"use client";
import * as React from "react";
import { Separator } from "@/components/tiptap-ui-primitive/separator";
import "@/components/tiptap-ui-primitive/toolbar/toolbar.scss";
import { cn } from "@/lib/tiptap-utils";

const mergeRefs = (refs) => {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref && typeof ref === "object" && "current" in ref) {
        ref.current = value;
      }
    });
  };
};

const useToolbarKeyboardNav = (toolbarRef) => {
  React.useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const getFocusableElements = () =>
      Array.from(
        toolbar.querySelectorAll(
          'button:not([disabled]), [role="button"]:not([disabled]), [tabindex="0"]:not([disabled])'
        )
      );

    const navigateToIndex = (e, targetIndex, elements) => {
      e.preventDefault();
      let nextIndex = targetIndex;

      if (nextIndex >= elements.length) {
        nextIndex = 0;
      } else if (nextIndex < 0) {
        nextIndex = elements.length - 1;
      }

      elements[nextIndex]?.focus();
    };

    const handleKeyDown = (e) => {
      const focusableElements = getFocusableElements();
      if (!focusableElements.length) return;

      const currentElement = document.activeElement;
      const currentIndex = focusableElements.indexOf(currentElement);

      if (!toolbar.contains(currentElement)) return;

      const keyActions = {
        ArrowRight: () =>
          navigateToIndex(e, currentIndex + 1, focusableElements),
        ArrowDown: () =>
          navigateToIndex(e, currentIndex + 1, focusableElements),
        ArrowLeft: () =>
          navigateToIndex(e, currentIndex - 1, focusableElements),
        ArrowUp: () => navigateToIndex(e, currentIndex - 1, focusableElements),
        Home: () => navigateToIndex(e, 0, focusableElements),
        End: () =>
          navigateToIndex(e, focusableElements.length - 1, focusableElements),
      };

      const action = keyActions[e.key];
      if (action) {
        action();
      }
    };

    const handleFocus = (e) => {
      const target = e.target;
      if (toolbar.contains(target)) {
        target.setAttribute("data-focus-visible", "true");
      }
    };

    const handleBlur = (e) => {
      const target = e.target;
      if (toolbar.contains(target)) {
        target.removeAttribute("data-focus-visible");
      }
    };

    toolbar.addEventListener("keydown", handleKeyDown);
    toolbar.addEventListener("focus", handleFocus, true);
    toolbar.addEventListener("blur", handleBlur, true);

    const focusableElements = getFocusableElements();
    focusableElements.forEach((element) => {
      element.addEventListener("focus", handleFocus);
      element.addEventListener("blur", handleBlur);
    });

    return () => {
      toolbar.removeEventListener("keydown", handleKeyDown);
      toolbar.removeEventListener("focus", handleFocus, true);
      toolbar.removeEventListener("blur", handleBlur, true);

      const focusableElements = getFocusableElements();
      focusableElements.forEach((element) => {
        element.removeEventListener("focus", handleFocus);
        element.removeEventListener("blur", handleBlur);
      });
    };
  }, [toolbarRef]);
};

const useToolbarVisibility = () => true;

const useGroupVisibility = () => true;

const useSeparatorVisibility = () => true;

export const Toolbar = React.forwardRef(
  ({ children, className, variant = "fixed", ...props }, ref) => {
    const toolbarRef = React.useRef(null);
    const isVisible = useToolbarVisibility(toolbarRef);

    useToolbarKeyboardNav(toolbarRef);

    if (!isVisible) return null;

    return (
      <div
        ref={mergeRefs([toolbarRef, ref])}
        role="toolbar"
        aria-label="toolbar"
        data-variant={variant}
        className={cn("tiptap-toolbar", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Toolbar.displayName = "Toolbar";

export const ToolbarGroup = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const groupRef = React.useRef(null);
    const isVisible = useGroupVisibility(groupRef);

    if (!isVisible) return null;

    return (
      <div
        ref={mergeRefs([groupRef, ref])}
        role="group"
        className={cn("tiptap-toolbar-group", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ToolbarGroup.displayName = "ToolbarGroup";

export const ToolbarSeparator = React.forwardRef(
  ({ fixed = false, ...props }, ref) => {
    const separatorRef = React.useRef(null);
    const isVisible = useSeparatorVisibility(separatorRef);

    if (!isVisible && !fixed) return null;

    return (
      <Separator
        ref={mergeRefs([separatorRef, ref])}
        orientation="vertical"
        decorative
        {...props}
      />
    );
  }
);

ToolbarSeparator.displayName = "ToolbarSeparator";
