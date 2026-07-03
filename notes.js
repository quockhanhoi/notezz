const fs = require('fs');
const path = require('path');
const notesDir = path.join(__dirname, '../note');

module.exports = {
    info: {
        path: '/notes',
        title: 'Notes List API',
        desc: 'List all notes with preview',
        example_url: [{ method: 'GET', query: '/notes', desc: 'List all notes' }]
    },
    methods: {
        get: (req, res) => {
            if (!fs.existsSync(notesDir)) return res.json([]);

            const files = fs.readdirSync(notesDir)
                .filter(f => f.endsWith('.txt') && !f.endsWith('.raw.txt'))
;

            const notes = files.map(file => {
                const uuid = file.replace(/\.txt$/, '');
                const filePath = path.join(notesDir, file);
                const stat = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf8');
                const firstLine = content.split('\n')[0].trim();
                return {
                    uuid,
                    preview: firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine || '(trống)',
                    size: stat.size,
                    updatedAt: stat.mtimeMs,
                };
            }).sort((a, b) => b.updatedAt - a.updatedAt);

            res.json(notes);
        }
    }
};
