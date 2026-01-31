'use client';

import { useState } from 'react';
import { Play, Database, CheckCircle2, Terminal, Code2, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import api from '@/services/api';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => (
        <div className="h-64 bg-gray-900 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
    )
});

interface Option {
    id: number;
    option_text: string;
}

interface Question {
    id: number;
    question_text: string;
    image_url?: string;
    question_type: 'mcq' | 'sql' | 'output' | 'statement' | 'coding';
    database_schema?: string;
    options: Option[];
    example_test_case?: { input: string; expected_output: string };
}

interface QuestionCardProps {
    question: Question;
    selectedOptionId?: number;
    onOptionSelect?: (optionId: number) => void;
    sqlAnswer?: string;
    onSqlChange?: (sql: string) => void;
    metadata?: any;
    onMetadataChange?: (metadata: any) => void;
}

// Language to Monaco language mapping
const MONACO_LANGUAGES: Record<string, string> = {
    python: 'python',
    java: 'java',
    csharp: 'csharp',
    cpp: 'cpp',
    javascript: 'javascript',
    c: 'c',
    go: 'go',
    ruby: 'ruby',
    rust: 'rust',
    php: 'php'
};

// Starter code templates
const STARTER_CODE: Record<string, string> = {
    python: '# Write your Python code here\n\n',
    java: '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n',
    csharp: '// Write your C# code here\nusing System;\n\nclass Program {\n    static void Main() {\n        \n    }\n}\n',
    cpp: '// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
    javascript: '// Write your JavaScript code here\n\n',
};

export function QuestionCard({
    question,
    selectedOptionId,
    onOptionSelect,
    sqlAnswer = '',
    onSqlChange,
    metadata,
    onMetadataChange
}: QuestionCardProps) {
    const [sqlResults, setSqlResults] = useState<any[] | null>(null);
    const [sqlError, setSqlError] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [codeOutput, setCodeOutput] = useState<string | null>(null);
    const [codeError, setCodeError] = useState<string | null>(null);
    const [customStdin, setCustomStdin] = useState<string>('');

    const handleRunCode = async () => {
        if (!onSqlChange) return;

        try {
            setIsRunning(true);
            setSqlError(null);
            setSqlResults(null);

            const response: any = await api.post('/questions/run-sql', {
                sql: sqlAnswer,
                database_schema: question.database_schema
            });

            setSqlResults(response.data.data);
        } catch (error: any) {
            setSqlError(error.response?.data?.message || 'Failed to execute SQL query');
        } finally {
            setIsRunning(false);
        }
    };

    // Run code for coding questions
    const handleRunCodingCode = async () => {
        if (!metadata?.selected_language || !sqlAnswer.trim()) return;

        try {
            setIsRunning(true);
            setCodeOutput(null);
            setCodeError(null);

            const response: any = await api.post('/code/execute', {
                language: metadata.selected_language,
                code: sqlAnswer,
                stdin: customStdin
            });

            if (response.data.data.success) {
                setCodeOutput(response.data.data.output || '(no output)');
            } else {
                setCodeError(response.data.data.error || 'Execution failed');
            }
        } catch (error: any) {
            setCodeError(error.response?.data?.message || 'Failed to execute code');
        } finally {
            setIsRunning(false);
        }
    };

    // Handle language change
    const handleLanguageChange = (lang: string) => {
        onMetadataChange?.({ ...metadata, selected_language: lang });

        // If current code is empty or matches ANY of the standard starter templates, replace it
        // This allows cycling through languages without leaving old templates behind
        const isDefaultTemplate = !sqlAnswer.trim() || Object.values(STARTER_CODE).some(code => code.trim() === sqlAnswer.trim());

        if (isDefaultTemplate) {
            onSqlChange?.(STARTER_CODE[lang] || '');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    {question.question_type === 'sql' ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                            <Database className="w-3 h-3" />
                            SQL Challenge
                        </span>
                    ) : question.question_type === 'output' ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider border border-purple-100">
                            <Play className="w-3 h-3" />
                            Output Prediction
                        </span>
                    ) : question.question_type === 'statement' ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                            <CheckCircle2 className="w-3 h-3" />
                            Statement Check
                        </span>
                    ) : question.question_type === 'coding' ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                            <Code2 className="w-3 h-3" />
                            Coding Challenge
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider border border-green-100">
                            <CheckCircle2 className="w-3 h-3" />
                            Multiple Choice
                        </span>
                    )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {question.question_text}
                </h2>
            </div>

            {
                question.question_type === 'mcq' || question.question_type === 'statement' ? (
                    <div className="space-y-4">
                        {question.options.map((option) => (
                            <label
                                key={option.id}
                                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedOptionId === option.id
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    value={option.id}
                                    checked={selectedOptionId === option.id}
                                    onChange={() => onOptionSelect?.(option.id)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-3 text-gray-700 font-medium">{option.option_text}</span>
                            </label>
                        ))}
                    </div>
                ) : question.question_type === 'sql' ? (
                    <div className="space-y-6">
                        {/* SQL Images specifically between question and editor */}
                        {question.image_url && (
                            <div className="flex flex-wrap justify-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                                {(() => {
                                    const backendUrl = 'http://localhost:5000';
                                    try {
                                        if (question.image_url.startsWith('[')) {
                                            return JSON.parse(question.image_url).map((url: string, idx: number) => {
                                                const fullUrl = url.startsWith('/') ? `${backendUrl}${url}` : url;
                                                return (
                                                    <img
                                                        key={idx}
                                                        src={fullUrl}
                                                        alt={`Context ${idx + 1}`}
                                                        className="max-h-80 object-contain rounded-md shadow-sm border border-gray-200"
                                                    />
                                                );
                                            });
                                        }
                                    } catch (e) { }
                                    const fullUrl = question.image_url.startsWith('/') ? `${backendUrl}${question.image_url}` : question.image_url;
                                    return <img src={fullUrl} alt="Question context" className="max-h-80 object-contain rounded-md shadow-sm" />;
                                })()}
                            </div>
                        )}

                        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-xl">
                            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                    </div>
                                    <span className="ml-3 text-[10px] text-gray-400 font-mono uppercase tracking-widest">query editor</span>
                                </div>
                                <button
                                    onClick={handleRunCode}
                                    disabled={isRunning || !sqlAnswer.trim()}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-md font-bold transition-all shadow-sm"
                                >
                                    {isRunning ? (
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Play className="w-3 h-3 fill-current" />
                                    )}
                                    RUN CODE
                                </button>
                            </div>
                            <textarea
                                className="w-full h-48 bg-gray-900 text-blue-400 p-4 font-mono text-sm resize-none focus:outline-none placeholder:text-gray-700"
                                placeholder="-- Write your SQL query here
SELECT * FROM ..."
                                value={sqlAnswer}
                                onChange={(e) => onSqlChange?.(e.target.value)}
                            />
                        </div>

                        {/* Results / Errors Area */}
                        {(sqlResults || sqlError) && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Output
                                </div>
                                <div className="p-4 bg-white overflow-x-auto max-h-60">
                                    {sqlError ? (
                                        <div className="text-red-600 font-mono text-xs whitespace-pre-wrap">
                                            Error: {sqlError}
                                        </div>
                                    ) : sqlResults && sqlResults.length > 0 ? (
                                        <table className="min-w-full text-xs font-mono">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {Object.keys(sqlResults[0]).map(key => (
                                                        <th key={key} className="px-3 py-2 text-left text-gray-600 border-b border-gray-200">{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {sqlResults.map((row, idx) => (
                                                    <tr key={idx}>
                                                        {Object.values(row).map((val: any, vIdx) => (
                                                            <td key={vIdx} className="px-3 py-2 text-gray-800">{String(val)}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-gray-400 italic text-xs">Query returned no rows or executed successfully with no output.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : question.question_type === 'output' ? (
                    <div className="space-y-6">
                        {question.database_schema && (
                            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-xl">
                                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest text-center block">Code Snippet</span>
                                </div>
                                <pre className="p-4 text-purple-400 font-mono text-sm overflow-x-auto">
                                    {question.database_schema}
                                </pre>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Output:</label>
                            <textarea
                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono min-h-[100px]"
                                placeholder="Type the expected output here..."
                                value={sqlAnswer}
                                onChange={(e) => onSqlChange?.(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    /* Coding Question with Monaco Editor */
                    <div className="space-y-6">
                        {/* Language Selection */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Select Language</p>
                                    <p className="text-xs text-gray-500">Choose the language for your solution</p>
                                </div>
                            </div>
                            <select
                                className="bg-white border border-emerald-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                value={metadata?.selected_language || ''}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                            >
                                <option value="">-- Select Language --</option>
                                <option value="python">🐍 Python 3</option>
                                <option value="java">☕ Java</option>
                                <option value="csharp">🔷 C#</option>
                                <option value="cpp">⚡ C++</option>
                                <option value="javascript">🟨 JavaScript</option>
                            </select>
                        </div>

                        {/* Example Test Case for Coding */}
                        {question.example_test_case && (
                            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                    <Code2 className="w-3.5 h-3.5" />
                                    Example Test Case (Reference)
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-2">Sample Input</label>
                                        <div className="bg-white border border-blue-100 rounded-lg p-3 font-mono text-xs text-gray-700 min-h-[40px] whitespace-pre-wrap">
                                            {question.example_test_case.input || '(no input)'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase mb-2">Expected Output</label>
                                        <div className="bg-white border border-blue-100 rounded-lg p-3 font-mono text-xs text-green-600 font-bold min-h-[40px] whitespace-pre-wrap">
                                            {question.example_test_case.expected_output}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-blue-400 italic font-medium">Use this example to understand the required input/output format.</p>
                            </div>
                        )}

                        {/* Monaco Code Editor */}
                        <div className="rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
                            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">
                                        {metadata?.selected_language || 'code editor'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleRunCodingCode}
                                    disabled={isRunning || !sqlAnswer.trim() || !metadata?.selected_language}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-4 py-2 rounded-md font-bold transition-all shadow-sm"
                                >
                                    {isRunning ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Play className="w-3 h-3 fill-current" />
                                    )}
                                    RUN CODE
                                </button>
                            </div>

                            {metadata?.selected_language ? (
                                <MonacoEditor
                                    height="350px"
                                    language={MONACO_LANGUAGES[metadata.selected_language] || 'plaintext'}
                                    theme="vs-dark"
                                    value={sqlAnswer}
                                    onChange={(value) => onSqlChange?.(value || '')}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        tabSize: 4,
                                        wordWrap: 'on',
                                        padding: { top: 16, bottom: 16 },
                                        suggestOnTriggerCharacters: true,
                                        quickSuggestions: true,
                                    }}
                                />
                            ) : (
                                <div className="h-[350px] bg-gray-900 flex items-center justify-center">
                                    <p className="text-gray-500 text-sm">Please select a language to start coding</p>
                                </div>
                            )}
                        </div>

                        {/* Custom Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Custom Input (stdin)</label>
                                <span className="text-[10px] text-gray-400 italic">Provide input values for your program</span>
                            </div>
                            <textarea
                                className="w-full h-20 bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                                placeholder="e.g. 5&#10;10"
                                value={customStdin}
                                onChange={(e) => setCustomStdin(e.target.value)}
                            />
                        </div>

                        {/* Code Output */}
                        {(codeOutput || codeError) && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                <div className={`px-4 py-2 border-b text-[10px] font-bold uppercase tracking-widest ${codeError ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500'
                                    }`}>
                                    {codeError ? '❌ Error' : '✅ Output'}
                                </div>
                                <div className={`p-4 font-mono text-sm whitespace-pre-wrap max-h-48 overflow-y-auto ${codeError ? 'bg-red-50 text-red-700' : 'bg-gray-900 text-green-400'
                                    }`}>
                                    {codeError || codeOutput}
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
