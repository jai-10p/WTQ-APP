interface Option {
    id: number;
    option_text: string;
}

interface Question {
    id: number;
    question_text: string;
    image_url?: string;
    options: Option[];
}

interface QuestionCardProps {
    question: Question;
    selectedOptionId?: number;
    onOptionSelect: (optionId: number) => void;
}

export function QuestionCard({ question, selectedOptionId, onOptionSelect }: QuestionCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[400px]">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                    {question.question_text}
                </h2>
                {question.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={question.image_url}
                        alt="Question"
                        className="mt-4 max-h-64 rounded-lg border border-gray-100"
                    />
                )}
            </div>

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
                            onChange={() => onOptionSelect(option.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 font-medium">{option.option_text}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
