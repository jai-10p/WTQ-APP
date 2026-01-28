# Exam Execution Data Flow

This document details the data flow and logic for the Student Exam Execution Engine.

## 1. Start Exam
**Endpoint:** `POST /api/v1/student/exams/:id/start`

1.  **Validation**:
    *   Check if Exam exists and is active.
    *   Check if current time is within `scheduled_start` and `scheduled_end`.
    *   Check if student already has a completed attempt (`submitted`, `abandoned`, `timeout`).
2.  **Logic**:
    *   If an `in_progress` attempt exists, return it (Resuming exam).
    *   Otherwise, create a new `ExamAttempt` with `status: 'in_progress'` and `started_at: NOW`.
3.  **Response**: Returns `attempt_id`, `started_at`, and `exam_duration`.

## 2. Fetch Questions
**Endpoint:** `GET /api/v1/student/attempts/:attemptId/questions`

1.  **Validation**: Verify attempt belongs to student.
2.  **Logic**:
    *   Fetch all `ExamQuestion` entries for the exam.
    *   Include `Question` and `MCQOption` details.
    *   **Crucial**: Exclude `is_correct` field from options to prevent cheating.
3.  **Response**: List of questions with options (shuffled if frontend handles it, or pre-ordered by `question_order`).

## 3. Submit Answer
**Endpoint:** `POST /api/v1/student/attempts/:attemptId/answer`

1.  **Validation**:
    *   Verify attempt is `in_progress`.
    *   Check if time has expired (Allowing a small grace period for network latency).
    *   Verify `exam_question_id` belongs to the current exam.
2.  **Logic**:
    *   Find existing `StudentAnswer` for this attempt + question.
    *   If exists -> Update `selected_option_id`.
    *   If new -> Create `StudentAnswer`.
3.  **Edge Cases**:
    *   **Timeout**: If request comes after strictly allowed time + grace period, reject with 400.
    *   **Network Failure**: Frontend should retry or cache locally. API handles idempotency via update logic.

## 4. Finish Exam
**Endpoint:** `POST /api/v1/student/attempts/:attemptId/submit`

1.  **Validation**: Verify attempt is `in_progress`.
2.  **Logic** (Transaction):
    *   Update attempt status to `submitted` (or `timeout` if time exceeded).
    *   **Scoring**:
        *   Fetch all `StudentAnswer`s.
        *   Compare `selected_option_id` with `MCQOption.is_correct`.
        *   Sum `(question_weightage)` for correct answers.
    *   Create `ExamResult` record with `total_score`, `percentage`, `is_passed`.
3.  **Response**: Final score and result.

## Edge Case Handling Strategy

| Scenario | Handling |
| :--- | :--- |
| **Exam Timeout** | Backend calculates `started_at + duration` on every answer/submit request. If exceeded (with buffer), mark as `timeout` or reject action. |
| **Browser Crash / Refresh** | `startExam` endpoint checks for existing `in_progress` attempt and resumes it seamlessly. |
| **Double Submission** | API checks status. If already submitted, returns existing result immediately. |
| **Late Request** | 2-minute grace period added to `isTimeExpired` check to account for slow connections. |
