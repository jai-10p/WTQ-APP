interface QuestionPaletteProps {
    totalQuestions: number;
    currentQuestionIndex: number;
    answeredIndices: number[];
    onSelect: (index: number) => void;
}

export function QuestionPalette({
    totalQuestions,
    currentQuestionIndex,
    answeredIndices,
    onSelect
}: QuestionPaletteProps) {
    return (
        <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }).map((_, index) => {
                const isAnswered = answeredIndices.includes(index);
                const isCurrent = currentQuestionIndex === index;

                let bgClass = "bg-gray-100 hover:bg-gray-200 text-gray-700";
                if (isCurrent) bgClass = "bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300 ring-offset-1";
                else if (isAnswered) bgClass = "bg-green-100 text-green-800 border-green-200 border";

                return (
                    <button
                        key={index}
                        onClick={() => onSelect(index)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${bgClass}`}
                    >
                        {index + 1}
                    </button>
                );
            })}
        </div>
    );
}
