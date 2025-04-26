const fs = require('fs');
const path = require('path');

class Storage {
    constructor() {
        this.dataPath = path.join(__dirname, 'data.json');
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataPath)) {
                return JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
            }
            return {};
        } catch (error) {
            console.error('خطأ في قراءة البيانات:', error);
            return {};
        }
    }

    saveData() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    }

    set(key, value) {
        this.data[key] = value;
        return this.saveData();
    }

    get(key) {
        return this.data[key];
    }

    delete(key) {
        delete this.data[key];
        return this.saveData();
    }
}

module.exports = new Storage(); 