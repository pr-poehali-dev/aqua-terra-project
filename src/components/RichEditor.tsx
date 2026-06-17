import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExt from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Icon from '@/components/ui/icon';
import { useRef } from 'react';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
}

const PHOTO_UPLOAD_URL = 'https://functions.poehali.dev/56ecfcae-0ead-4151-b546-411ce113bde1';

function ToolBtn({ onClick, title, active, children }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${active ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ value, onChange, onUploadImage }: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      ImageExt,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Начните писать статью…' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'outline-none min-h-[260px] prose prose-sm max-w-none text-foreground' },
    },
  });

  if (!editor) return null;

  const addImage = async (file: File) => {
    let url = '';
    if (onUploadImage) {
      url = await onUploadImage(file);
    } else {
      const reader = new FileReader();
      url = await new Promise((res) => { reader.onload = (e) => res(e.target?.result as string); reader.readAsDataURL(file); });
    }
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const url = window.prompt('Введите ссылку:', editor.getAttributes('link').href || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="border border-input rounded-xl overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/40">
        {/* Text style */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} title="Жирный" active={editor.isActive('bold')}>
          <strong>B</strong>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} title="Курсив" active={editor.isActive('italic')}>
          <em>I</em>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} title="Подчёркивание" active={editor.isActive('underline')}>
          <span className="underline">U</span>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} title="Зачёркивание" active={editor.isActive('strike')}>
          <span className="line-through">S</span>
        </ToolBtn>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Заголовок 1" active={editor.isActive('heading', { level: 1 })}>
          H1
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Заголовок 2" active={editor.isActive('heading', { level: 2 })}>
          H2
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Заголовок 3" active={editor.isActive('heading', { level: 3 })}>
          H3
        </ToolBtn>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Align */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} title="По левому краю" active={editor.isActive({ textAlign: 'left' })}>
          <Icon name="AlignLeft" size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} title="По центру" active={editor.isActive({ textAlign: 'center' })}>
          <Icon name="AlignCenter" size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} title="По правому краю" active={editor.isActive({ textAlign: 'right' })}>
          <Icon name="AlignRight" size={14} />
        </ToolBtn>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} title="Маркированный список" active={editor.isActive('bulletList')}>
          <Icon name="List" size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Нумерованный список" active={editor.isActive('orderedList')}>
          <Icon name="ListOrdered" size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Цитата" active={editor.isActive('blockquote')}>
          <Icon name="Quote" size={14} />
        </ToolBtn>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link & Image */}
        <ToolBtn onClick={setLink} title="Ссылка" active={editor.isActive('link')}>
          <Icon name="Link" size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => fileRef.current?.click()} title="Вставить изображение">
          <Icon name="Image" size={14} />
        </ToolBtn>

        <div className="w-px h-6 bg-border mx-1" />

        {/* History */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Отменить">
          <Icon name="Undo" size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Повторить">
          <Icon name="Redo" size={14} />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = ''; }} />

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 { font-family: 'Cormorant', serif; font-size: 2rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .ProseMirror h2 { font-family: 'Cormorant', serif; font-size: 1.5rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
        .ProseMirror h3 { font-family: 'Cormorant', serif; font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
        .ProseMirror p { margin: 0.5rem 0; line-height: 1.7; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .ProseMirror blockquote { border-left: 3px solid hsl(var(--primary)); padding-left: 1rem; color: hsl(var(--muted-foreground)); font-style: italic; }
        .ProseMirror img { max-width: 100%; border-radius: 0.75rem; margin: 0.75rem 0; }
        .ProseMirror a { color: hsl(var(--secondary)); text-decoration: underline; }
        .ProseMirror hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1rem 0; }
      `}</style>
    </div>
  );
}
