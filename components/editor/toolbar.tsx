import { type Editor } from "@tiptap/react";
import { Bold, Heading2, Italic, List, Strikethrough } from "lucide-react";
import { FC } from "react";
import { Toggle } from "../ui/toggle";

type TiptapToolbarProps = {
  editor: Editor | null;
};

const TiptapToolbar: FC<TiptapToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="rounded-md border border-input mb-2">
      <Toggle
        size={"sm"}
        pressed={editor.isActive("heading")}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="h-5 w-5" />
      </Toggle>
      <Toggle
        size={"sm"}
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-5 w-5" />
      </Toggle>
      <Toggle
        size={"sm"}
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-5 w-5" />
      </Toggle>
      <Toggle
        size={"sm"}
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-5 w-5" />
      </Toggle>
      <Toggle
        size={"sm"}
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-5 w-5" />
      </Toggle>
    </div>
  );
};

export default TiptapToolbar;
