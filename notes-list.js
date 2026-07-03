const fs = require('fs');
const path = require('path');

const notesDir = path.join(__dirname, '../note');

if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

const makePreview = (text) => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return '(Trống)';
    return clean.length > 90 ? clean.slice(0, 90) + '…' : clean;
};

module.exports = {
    info: {
        path: '/notes',
        title: 'Notes List API',
        desc: 'List all existing notes with preview and last updated time',
        example_url: [
            { method: 'GET', query: '/notes', desc: 'List all notes' }
        ]
    },
    methods: {
        get: (req, res) => {
            const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.txt') && !f.endsWith('.raw'));

            const notes = files.map(file => {
                const filePath = path.join(notesDir, file);
                const stat = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf8');

                return {
                    id: file.replace(/\.txt$/, ''),
                    preview: makePreview(content),
                    length: content.length,
                    updatedAt: stat.mtime,
                };
            }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            res.json(notes);
        },
    },
};
