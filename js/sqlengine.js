// We use a global variable to store the database instance
let db = null;

// Initialize sql.js
export async function initSqlEngine() {
    try {
        // sql.js needs to know where its wasm file is
        const config = {
            locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${filename}`
        };
        
        // initSqlJs is available globally via CDN load
        if (typeof initSqlJs === 'undefined') {
            await loadSqlJsScript();
        }
        
        const SQL = await initSqlJs(config);
        
        // Create an empty, in-memory database
        db = new SQL.Database();
        
        // Seed some basic tables for the exam environment (optional default setup)
        // You could also modify this to load a predefined DB if needed
        db.run(`
            CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary INTEGER);
            INSERT INTO employees VALUES (1, 'Alice', 'Engineering', 90000);
            INSERT INTO employees VALUES (2, 'Bob', 'HR', 60000);
            INSERT INTO employees VALUES (3, 'Charlie', 'Engineering', 95000);
            INSERT INTO employees VALUES (4, 'Diana', 'Marketing', 75000);
        `);
        
        console.log("sql.js engine initialized successfully.");
        return true;
    } catch (err) {
        console.error("Failed to initialize sql.js:", err);
        return false;
    }
}

// Helper to manually load the script if not in HTML
function loadSqlJsScript() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Run a query and return results or throw an error
export function runQuery(sqlString) {
    if (!db) {
        throw new Error("Database engine not initialized.");
    }
    
    try {
        const results = db.exec(sqlString);
        if (results && results.length > 0) {
            return {
                columns: results[0].columns,
                values: results[0].values
            };
        } else {
            // Execution successful, but query doesn't return data (e.g., INSERT)
            return { columns: [], values: [] };
        }
    } catch (error) {
        throw error;
    }
}
