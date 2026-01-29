import { useState } from 'react';
import { Play, Database, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';

interface Option {
    id: number;
    option_text: string;
}

interface Question {
    id: number;
    question_text: string;
    image_url?: string;
    question_type: 'mcq' | 'sql';
    database_schema?: string;
    options: Option[];
}

interface QuestionCardProps {
    question: Question;
    selectedOptionId?: number;
    onOptionSelect?: (optionId: number) => void;
    sqlAnswer?: string;
    onSqlChange?: (sql: string) => void;
}

export function QuestionCard({
    question,
    selectedOptionId,
    onOptionSelect,
    sqlAnswer = '',
    onSqlChange
}: QuestionCardProps) {
    const [sqlResults, setSqlResults] = useState<any[] | null>(null);
    const [sqlError, setSqlError] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);

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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    {question.question_type === 'sql' ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                            <Database className="w-3 h-3" />
                            SQL Challenge
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
                {question.image_url && (
                    <div className="mt-6 flex justify-center bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <img
                            src={question.image_url}
                            alt="Question context"
                            className="max-h-80 object-contain rounded-md shadow-sm"
                        />
                    </div>
                )}
            </div>

            {question.question_type === 'mcq' ? (
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
            ) : (
                <div className="space-y-6">
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
                            className="w-full h-48 bg-gray-900 text-green-400 p-4 font-mono text-sm resize-none focus:outline-none placeholder:text-gray-700"
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
            )}
        </div>
    );
}
