export class HistoryManager {
    storage_key = 'history';
    history = [];

    constructor() {
        this.load();
    }

    load() {
        let stored = JSON.parse(localStorage.getItem(this.storage_key));
        if (stored === null) {
            stored = [];
            this.save(stored);
        }
        this.history = stored;
        return this.history;
    }

    append(score) {
        this.history.push(score);
        this.save();
    }

    save(value) {
        localStorage.setItem(
            this.storage_key,
            JSON.stringify(value ? value : this.history)
        );
    }
}
