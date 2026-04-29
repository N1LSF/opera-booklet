import React, { useRef } from 'react';

const Btn = ({ active, onClick, title, children }) => (
    <button
        type="button"
        className={`tb-btn ${active ? 'active' : ''}`}
        onClick={onClick}
        title={title}
    >
        {children}
    </button>
);

const Sep = () => <span className="tb-sep" />;

export default function EditorToolbar({ editor, onExport, onClear, isExporting }) {
    const fileRef = useRef(null);

    if (!editor) return null;

    const handleImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    return (
        <div className="toolbar">
            <div className="toolbar-inner">
                <Btn
                    active={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    title="Заголовок (название оперы)"
                >
                    H<sub>1</sub>
                </Btn>
                <Btn
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Подзаголовок"
                >
                    H<sub>2</sub>
                </Btn>
                <Btn
                    active={editor.isActive('paragraph')}
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    title="Обычный текст"
                >
                    ¶
                </Btn>

                <Sep />

                <Btn
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Жирный"
                >
                    <strong>Ж</strong>
                </Btn>
                <Btn
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Курсив"
                >
                    <em>К</em>
                </Btn>

                <Sep />

                <Btn
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    title="Цитата"
                >
                    ❝
                </Btn>
                <Btn
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Список"
                >
                    •
                </Btn>

                <Sep />

                <Btn
                    onClick={() => fileRef.current?.click()}
                    title="Вставить картинку"
                >
                    🖼
                </Btn>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    style={{ display: 'none' }}
                />

                <Btn
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Декоративный разделитель"
                >
                    ❦
                </Btn>
                <Btn
                    onClick={() => editor.chain().focus().insertPageBreak().run()}
                    title="Разрыв страницы"
                >
                    ⤓
                </Btn>

                <div className="tb-spacer" />

                <button
                    type="button"
                    className="tb-action tb-clear"
                    onClick={onClear}
                    title="Очистить всё"
                >
                    Очистить
                </button>
                <button
                    type="button"
                    className="tb-action tb-export"
                    onClick={onExport}
                    disabled={isExporting}
                >
                    {isExporting ? 'Готовим PDF…' : '↓ Скачать PDF'}
                </button>
            </div>
        </div>
    );
}