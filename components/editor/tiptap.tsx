"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";
import Toolbar from "./toolbar";

type TiptapProps = {
  description: string;
  onChange?: (richText: string) => void;
  preview?: boolean;
  showToolbar?: boolean;
};

const Tiptap: React.FC<TiptapProps> = ({ description, onChange, preview, showToolbar = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-8",
          },
        },
        heading: {
          levels: [2],
          HTMLAttributes: {
            class: "text-2xl font-bold",
          },
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "rounded-md text-black min-w-full focus-visible:outline-none border min-h-[150px] p-2 border-input",
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) onChange(editor.getHTML());
      //   console.log("description", editor.getHTML());
    },
    editable: preview ? false : true,
    immediatelyRender: false,
  });

  React.useEffect(() => {
    if (editor?.isEmpty) editor.commands.setContent(description);
  }, [description, editor]);

  return (
    <>
      {preview ? (
        <EditorContent
          editor={editor}
          className="rounded-none !border-none ring-0"
        />
      ) : (
        <div className="flex min-h-[150px] flex-col justify-stretch">
          {showToolbar && <Toolbar editor={editor} />}
          <EditorContent editor={editor} />
        </div>
      )}
    </>
  );
};

export default Tiptap;
