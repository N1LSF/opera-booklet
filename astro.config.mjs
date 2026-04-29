import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
    site: 'https://n1lsf.github.io',
    base: '/opera-booklet',
    integrations: [react()],
});