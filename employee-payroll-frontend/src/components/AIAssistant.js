import React, { useState } from 'react';
import { aiAPI } from '../services/api';

const EXAMPLE_QUERIES = [
    'Show me all employees who worked overtime last week',
    'Which department has the most employees?',
    'List all managers and their departments',
    'Show total hours worked per employee this week',
    'Which employees are currently active?',
];

function AIAssistant() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await aiAPI.naturalLanguageQuery(query);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Query failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExample = (example) => {
        setQuery(example);
        setResult(null);
        setError(null);
    };

    const renderTable = (data) => {
        if (!data || data.length === 0) {
            return <p style={styles.noData}>No results found.</p>;
        }

        const columns = Object.keys(data[0]);

        return (
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col} style={styles.th}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                                {columns.map((col) => (
                                    <td key={col} style={styles.td}>{row[col] ?? '—'}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>AI Query Assistant</h2>
                <p style={styles.subtitle}>
                    Ask questions about your workforce in plain English
                </p>
            </div>

            {/* Example queries */}
            <div style={styles.examples}>
                <p style={styles.exampleLabel}>Try an example:</p>
                <div style={styles.exampleButtons}>
                    {EXAMPLE_QUERIES.map((ex) => (
                        <button
                            key={ex}
                            style={styles.exampleBtn}
                            onClick={() => handleExample(ex)}
                        >
                            {ex}
                        </button>
                    ))}
                </div>
            </div>

            {/* Query form */}
            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Show me all employees who worked overtime last week"
                    style={styles.input}
                    disabled={loading}
                />
                <button
                    type="submit"
                    style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
                    disabled={loading || !query.trim()}
                >
                    {loading ? 'Thinking...' : 'Ask AI'}
                </button>
            </form>

            {/* Generated SQL */}
            {result?.generatedSql && (
                <div style={styles.sqlBox}>
                    <p style={styles.sqlLabel}>Generated SQL:</p>
                    <code style={styles.sqlCode}>{result.generatedSql}</code>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={styles.errorBox}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Results table */}
            {result?.data && (
                <div style={styles.results}>
                    <p style={styles.rowCount}>
                        {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} returned
                    </p>
                    {renderTable(result.data)}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { padding: '24px', maxWidth: '1000px', margin: '0 auto' },
    header: { marginBottom: '24px' },
    title: { margin: '0 0 8px', fontSize: '1.6rem', color: '#1a1a2e' },
    subtitle: { margin: 0, color: '#666', fontSize: '0.95rem' },
    examples: { marginBottom: '20px' },
    exampleLabel: { margin: '0 0 8px', fontSize: '0.85rem', color: '#888', fontWeight: 600 },
    exampleButtons: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    exampleBtn: {
        background: '#f0f4ff', border: '1px solid #c5d0f0', borderRadius: '20px',
        padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer', color: '#3b5bdb',
        transition: 'background 0.2s',
    },
    form: { display: 'flex', gap: '10px', marginBottom: '20px' },
    input: {
        flex: 1, padding: '12px 16px', fontSize: '1rem', borderRadius: '8px',
        border: '1px solid #ddd', outline: 'none',
    },
    submitBtn: {
        padding: '12px 24px', background: '#3b5bdb', color: 'white', border: 'none',
        borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600,
        transition: 'opacity 0.2s',
    },
    sqlBox: {
        background: '#1e1e2e', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px',
    },
    sqlLabel: { color: '#888', fontSize: '0.8rem', margin: '0 0 6px', textTransform: 'uppercase' },
    sqlCode: { color: '#a6e3a1', fontSize: '0.9rem', wordBreak: 'break-all', fontFamily: 'monospace' },
    errorBox: {
        background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: '8px',
        padding: '12px 16px', color: '#721c24', marginBottom: '16px',
    },
    results: { marginTop: '8px' },
    rowCount: { color: '#555', fontSize: '0.85rem', margin: '0 0 10px' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    th: {
        background: '#3b5bdb', color: 'white', padding: '10px 14px',
        textAlign: 'left', fontWeight: 600,
    },
    td: { padding: '9px 14px', borderBottom: '1px solid #eee' },
    trEven: { background: '#fff' },
    trOdd: { background: '#f8f9ff' },
    noData: { color: '#888', fontStyle: 'italic' },
};

export default AIAssistant;
