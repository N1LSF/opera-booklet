import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { PageBreak } from './extensions/PageBreak.js';
import EditorToolbar from './EditorToolbar.jsx';
import '../styles/booklet.css';

const STORAGE_KEY = 'opera-booklet-draft-v1';

const INITIAL_CONTENT = `
<div data-cover="true">
    <h1>Турандот</h1>
    <p class="cover-meta">Опера в трёх действиях · Джакомо Пуччини</p>
</div>
<div data-page-break="true"></div>
<h2>О чём опера</h2>
<p>Введите вступительный текст. Расскажите коротко о сюжете, эпохе и героях, чтобы зритель пришёл в зал подготовленным.</p>
<blockquote><p>Любовь тайная, невысказанная, огромная настолько, что и мученья в радость.</p></blockquote>
<h2>Главные герои</h2>
<ul><li>Турандот — китайская принцесса</li><li>Калаф — неизвестный принц</li><li>Лиу — рабыня</li></ul>
`;

export default function BookletEditor() {
    const [isExporting, setIsExporting] = useState(false);
    const [savedAt, setSavedAt] = useState(null);
    const pagesRef = useRef(null);
    const saveTimer = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2] },
                horizontalRule: { HTMLAttributes: { class: 'ornament' } },
            }),
            Image.configure({
                HTMLAttributes: { class: 'booklet-image' },
                allowBase64: true,
            }),
            Placeholder.configure({
                placeholder: 'Начните писать…',
            }),
            PageBreak,
        ],
        content: (() => {
            if (typeof window === 'undefined') return INITIAL_CONTENT;
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                return saved ? JSON.parse(saved) : INITIAL_CONTENT;
            } catch {
                return INITIAL_CONTENT;
            }
        })(),
        onUpdate: ({ editor }) => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(editor.getJSON()));
                    setSavedAt(new Date());
                } catch (e) {
                    console.warn('Не удалось сохранить черновик', e);
                }
            }, 1500);
        },
        editorProps: {
            attributes: {
                class: 'booklet-content',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer?.files?.length) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        event.preventDefault();
                        const reader = new FileReader();
                        reader.onload = () => {
                            const { schema } = view.state;
                            const node = schema.nodes.image.create({ src: reader.result, alt: file.name });
                            const tr = view.state.tr.replaceSelectionWith(node);
                            view.dispatch(tr);
                        };
                        reader.readAsDataURL(file);
                        return true;
                    }
                }
                return false;
            },
        },
    });

    const handleClear = useCallback(() => {
        if (!confirm('Удалить весь текст и начать заново?')) return;
        editor?.commands.setContent(INITIAL_CONTENT);
        localStorage.removeItem(STORAGE_KEY);
    }, [editor]);

    const handleExport = useCallback(async () => {
        if (!pagesRef.current) return;
        setIsExporting(true);

        const html2pdf = (await import('html2pdf.js')).default;

        // Клонируем содержимое и режем по разрывам страниц
        const source = pagesRef.current.cloneNode(true);
        source.classList.add('export-mode');

        // Получаем заголовок для имени файла
        const titleEl = source.querySelector('h1');
        const filename = (titleEl?.textContent?.trim() || 'booklet')
            .toLowerCase()
            .replace(/[^a-zа-я0-9]+/gi, '-')
            .replace(/^-|-$/g, '') + '.pdf';

        const opt = {
            margin: 0,
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#FBF6EC',
                letterRendering: true,
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                compress: true,
            },
            pagebreak: {
                mode: ['css', 'legacy'],
                before: '[data-page-break]',
                avoid: ['img', 'blockquote', 'h1', 'h2'],
            },
        };

        try {
            await html2pdf().set(opt).from(source).save();
        } catch (err) {
            console.error(err);
            alert('Не удалось сохранить PDF. Попробуйте ещё раз.');
        } finally {
            setIsExporting(false);
        }
    }, []);

    useEffect(() => () => saveTimer.current && clearTimeout(saveTimer.current), []);

    return (
        <div className="editor-shell">
            <EditorToolbar
                editor={editor}
                onExport={handleExport}
                onClear={handleClear}
                isExporting={isExporting}
            />

            <div className="status-bar">
                {savedAt && (
                    <span className="saved-indicator">
                        ✓ Черновик сохранён в {savedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>

            <div className="paper-stage">
                <div className="paper" ref={pagesRef}>
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}