function parseINI(text) {
    const result = {};
    let section = null;

    text.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith("#") || line.startsWith(";")) return;

        const matchSection = line.match(/^\[(.+?)\]$/);
        if (matchSection) {
            section = matchSection[1];
            result[section] = {};
            return;
        }

        const matchKeyValue = line.match(/^([^=]+)=(.+)$/);
        if (matchKeyValue && section) {
            let key = matchKeyValue[1].trim();
            let value = matchKeyValue[2].trim();

            // remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            result[section][key] = value;
        }
    });

    return result;
}
