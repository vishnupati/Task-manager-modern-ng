import '@angular/compiler'; import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import 'zone.js/node';

import { bootstrap } from './src/main.server';

const port = process.env[ 'PORT' ] || 4000;
const distFolder = join(process.cwd(), 'dist/task-management-angular-modern/browser');
const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? join(distFolder, 'index.original.html')
    : join(distFolder, 'index.html');

const app = express();
const commonEngine = new CommonEngine();

app.set('view engine', 'html');
app.set('views', distFolder);

// Serve static files from dist/browser
app.use(
    express.static(distFolder, {
        maxAge: '1y',
        etag: false,
    })
);

// All regular routes use the CommonEngine to render the page.
app.use((req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
        .render({
            bootstrap: bootstrap,
            documentFilePath: indexHtml,
            url: `${protocol}://${headers.host}${originalUrl}`,
            publicPath: distFolder,
            providers: [
                { provide: APP_BASE_HREF, useValue: baseUrl },
            ],
        })
        .then((html) => res.send(html))
        .catch((err) => {
            console.error('SSR Error:', err);
            res.sendStatus(500);
        });
});

console.log(`Node Express server listening on http://localhost:${port}`);
app.listen(port);
