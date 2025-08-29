// src/student/StudentTakeExam.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Paper,
    LinearProgress,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    useMediaQuery,
    useTheme,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Checkbox,
    FormControl,
    FormLabel,
    FormGroup,
    Snackbar,
    Alert as MuiAlert,
    Avatar,
    Grid, // Import Grid for layout
    Tooltip, // Import Tooltip for hover info
} from "@mui/material";
import {
    ArrowBack as ArrowBackIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    DoneAll as DoneAllIcon,
    Clear as ClearIcon, // Import Clear icon for the new button
} from "@mui/icons-material";
import { db } from "../firebaseConfig";
import { doc, getDoc, serverTimestamp, collection, addDoc, updateDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import { useAuth } from '../AuthContext';

// --- StudentQuestionDisplay Component ---
const StudentQuestionDisplay = ({ question, index, studentAnswer, onAnswerChange, readonly = false }) => {
    const mediaUrl = question.media;
    const isVideo = mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.ogg'));
    const isImage = mediaUrl && (mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.jpeg') || mediaUrl.endsWith('.png') || mediaUrl.endsWith('.gif'));

    const handleMcqChange = (event) => {
        onAnswerChange(event.target.value);
    };

    const handleTextChange = (event) => {
        onAnswerChange(event.target.value);
    };

    const renderQuestionInput = () => {
        switch (question.type) {
            case "multiple-choice":
                return (
                    <FormControl component="fieldset" fullWidth margin="normal">
                        <FormLabel component="legend" sx={{ mb: 1, color: '#3f51b5', fontWeight: 'bold' }}>
                            Select your answer:
                        </FormLabel>
                        <RadioGroup value={studentAnswer || ""} onChange={handleMcqChange} name={`question-${index}`}>
                            {question.options.map((option, optIndex) => (
                                <FormControlLabel
                                    key={option.id || optIndex}
                                    value={option.text}
                                    control={<Radio disabled={readonly} />}
                                    label={<Typography variant="body1">{option.text}</Typography>}
                                    sx={{
                                        p: 1,
                                        mb: 0.5,
                                        borderRadius: '8px',
                                        backgroundColor: (studentAnswer === option.text && !readonly) ? '#e8eaf6' : 'transparent',
                                        '&:hover': { backgroundColor: '#e8eaf6' },
                                    }}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                );
            case "true-false":
                return (
                    <FormControl component="fieldset" fullWidth margin="normal">
                        <FormLabel component="legend" sx={{ mb: 1, color: '#3f51b5', fontWeight: 'bold' }}>
                            Select True or False:
                        </FormLabel>
                        <RadioGroup value={studentAnswer || ""} onChange={handleMcqChange} name={`question-${index}`}>
                            <FormControlLabel value="True" control={<Radio disabled={readonly} />} label="True" />
                            <FormControlLabel value="False" control={<Radio disabled={readonly} />} label="False" />
                        </RadioGroup>
                    </FormControl>
                );
            case "fill-blanks":
            case "short-answer":
            case "reasoning":
                return (
                    <TextField
                        fullWidth
                        label="Your Answer"
                        multiline
                        rows={question.type === "reasoning" ? 6 : 3}
                        value={studentAnswer || ""}
                        onChange={handleTextChange}
                        margin="normal"
                        variant="outlined"
                        disabled={readonly}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                backgroundColor: readonly ? 'rgba(0,0,0,0.04)' : '#ffffff',
                            },
                        }}
                    />
                );
            case "match":
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="#3f51b5">
                            Match the pairs:
                        </Typography>
                        {question.matchPairs.map((pair, i) => (
                            <Box key={pair.id || i} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                                <TextField
                                    label={`Left ${i + 1}`}
                                    value={pair.left}
                                    InputProps={{ readOnly: true }}
                                    variant="outlined"
                                    size="small"
                                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#e0e0e0' } }}
                                />
                                <Typography variant="h6" sx={{ mx: 1 }}>↔</Typography>
                                <TextField
                                    label={`Your Match for ${pair.left}`}
                                    value={(studentAnswer && studentAnswer[pair.left]) || ""}
                                    onChange={(e) => onAnswerChange({ ...studentAnswer, [pair.left]: e.target.value })}
                                    variant="outlined"
                                    size="small"
                                    disabled={readonly}
                                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: readonly ? 'rgba(0,0,0,0.04)' : '#ffffff' } }}
                                />
                            </Box>
                        ))}
                    </Box>
                );
            default:
                return <Typography color="error">Unsupported question type: {question.type}</Typography>;
        }
    };

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: '16px', bgcolor: '#ffffff' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" color="#3f51b5">
                Question {index + 1}
            </Typography>
            {mediaUrl && (
                <Box sx={{ mb: 2, textAlign: "center" }}>
                    {isVideo ? (
                        <video src={mediaUrl} controls style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                    ) : isImage ? (
                        <img src={mediaUrl} alt="Question media" style={{ maxWidth: "100%", maxHeight: 300, borderRadius: '8px' }} />
                    ) : null}
                </Box>
            )}
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {question.question}
            </Typography>
            {renderQuestionInput()}
        </Paper>
    );
};
// --- End StudentQuestionDisplay Component ---


const StudentTakeExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth(); // Use user.id for consistency
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [studentAnswers, setStudentAnswers] = useState({}); // { questionId: answer }
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [loading, setLoading] = useState(true);
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const [finishEarlyDialogOpen, setFinishEarlyDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    
    const intervalRef = useRef(null);
    const examStartTimeRef = useRef(null); // To store when the exam actually started
    const [submissionId, setSubmissionId] = useState(null); // New state for submission document ID

    // Refs for latest state values to be used in useCallback functions without re-creating them
    const studentAnswersRef = useRef(studentAnswers);
    const timeLeftRef = useRef(timeLeft);
    const submissionIdRef = useRef(submissionId);
    const examRef = useRef(exam);
    const userRef = useRef(user);


    // Update refs whenever the corresponding state changes
    useEffect(() => { studentAnswersRef.current = studentAnswers; }, [studentAnswers]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
    useEffect(() => { submissionIdRef.current = submissionId; }, [submissionId]);
    useEffect(() => { examRef.current = exam; }, [exam]);
    useEffect(() => { userRef.current = user; }, [user]);


    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    // Helper function to check if a question is answered
    const isQuestionAnswered = useCallback((question, answers) => {
        const answer = answers[question.id];

        if (!answer) {
            return false; // No answer at all
        }

        switch (question.type) {
            case "multiple-choice":
            case "true-false":
                return !!answer; // Check if a value exists for MCQs and True/False
            case "fill-blanks":
            case "short-answer":
            case "reasoning":
                return typeof answer === 'string' && answer.trim().length > 0; // Check for non-empty string
            case "match":
                // For match questions, check if all 'left' parts in the question have a corresponding non-empty 'right' answer
                if (typeof answer === 'object' && answer !== null) {
                    const questionPairs = question.matchPairs || [];
                    return questionPairs.every(pair => 
                        pair.left && typeof answer[pair.left] === 'string' && answer[pair.left].trim().length > 0
                    );
                }
                return false;
            default:
                return false;
        }
    }, []);

    // New function to handle navigation back to the exam list and clear the session storage key
    // This useCallback is now stable as it only depends on navigate
    const handleBackToList = useCallback(() => {
        const currentUser = userRef.current; // Use ref
        // Consistent: Use currentUser.id
        const unlockedKey = currentUser?.id ? `examUnlocked-${currentUser.id}-${examId}` : null;
        if (unlockedKey) {
            sessionStorage.removeItem(unlockedKey);
            console.log(`[StudentTakeExam] Explicitly removed sessionStorage key: ${unlockedKey} before navigating back.`);
        }
        navigate("/student-exam-list");
    }, [examId, navigate]);


    // Make handleSubmitExam also useCallback to ensure stable reference for useEffect
    // This useCallback is now stable as it only depends on navigate
    const handleSubmitExam = useCallback(async (
        overrideSubmissionId,
        overrideDuration,
        currentStudentAnswers,
        currentTimeLeft
    ) => {
        const currentSubmissionId = overrideSubmissionId !== undefined ? overrideSubmissionId : submissionIdRef.current;
        const currentExam = examRef.current;
        const currentUser = userRef.current;
        const currentAnswers = currentStudentAnswers !== undefined ? currentStudentAnswers : studentAnswersRef.current;
        const currentDurationLeft = currentTimeLeft !== undefined ? currentTimeLeft : timeLeftRef.current;
        const currentOverrideDuration = overrideDuration !== undefined ? overrideDuration : (currentExam?.duration * 60);

        setSubmitDialogOpen(false); // Close confirmation dialog
        setLoading(true); // Show loading spinner during submission
        clearInterval(intervalRef.current); // Stop the timer

        if (!currentSubmissionId || !currentExam || !currentUser) {
            console.error("Attempted to submit without a valid submission ID, exam data, or user data.");
            setSnackbarMessage("Submission error: Missing data. Please contact support.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            setLoading(false);
            return;
        }

        try {
            const finalDurationTaken = currentOverrideDuration - currentDurationLeft; // Use argument or ref

            const submissionData = {
                answers: currentAnswers, // Use argument or ref
                endTime: serverTimestamp(),
                durationTaken: finalDurationTaken,
                isSubmitted: true, // Mark as definitively submitted
            };

            const submissionRef = doc(db, "examSubmissions", currentSubmissionId);
            await updateDoc(submissionRef, submissionData);

            setSnackbarMessage("Exam submitted successfully! 🎉");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);

            // Clear the access token after successful submission
            // Consistent: Use currentUser.id
            const unlockedKey = currentUser?.id ? `examUnlocked-${currentUser.id}-${currentExam.id}` : null;
            if (unlockedKey) { // Ensure key is valid before removing
                sessionStorage.removeItem(unlockedKey);
                console.log(`[StudentTakeExam] Removed sessionStorage key: ${unlockedKey} after submission.`); // Debug log
            }

            setTimeout(() => {
                navigate("/student-dashboard"); // Redirect to dashboard or results page
            }, 2000);

        } catch (error) {
            console.error("Error submitting exam:", error);
            setSnackbarMessage("Failed to submit exam. Please try again.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            setLoading(false);
        }
    }, [navigate]);


    // --- Auto-save function ---
    // This useCallback is now stable as it only depends on navigate (implicitly via handleSubmitExam)
    const saveStudentAnswersToDb = useCallback(async () => {
        const currentSubmissionId = submissionIdRef.current; // Use ref
        const currentExam = examRef.current; // Use ref
        const currentUser = userRef.current; // Use ref
        const currentStudentAnswers = studentAnswersRef.current; // Use ref

        if (!currentSubmissionId || !currentExam || !currentUser) {
            console.warn("[Auto-Save] Attempted to auto-save without submissionId, exam, or user. Skipping.");
            return;
        }
        
        console.log(`[Auto-Save] Saving answers for submission ID: ${currentSubmissionId}`, currentStudentAnswers);
        try {
            const submissionRef = doc(db, "examSubmissions", currentSubmissionId);
            await updateDoc(submissionRef, {
                answers: currentStudentAnswers, // This will be the current state of answers
                updatedAt: serverTimestamp(),
            });
            setSnackbarMessage("Response Saved! ✨");
            setSnackbarSeverity("info"); // Use info for non-critical feedback
            setSnackbarOpen(true);
        } catch (error) {
            console.error("[Auto-Save] Error auto-saving answers:", error);
            setSnackbarMessage("Auto-save failed. Please check your connection.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    }, []); // Empty dependencies, making this function truly stable


    // Effect for debounced auto-save on answer changes
    // This effect now correctly uses studentAnswers as a dependency, and calls the stable saveStudentAnswersToDb
    useEffect(() => {
        // Only trigger save if submissionId is set and studentAnswers has changed (and isn't just an initial empty load)
        // Check for submissionId and that the current answers are not simply the initial empty map
        if (submissionId && Object.keys(studentAnswers).length > 0) { 
            console.log("[Auto-Save Effect] Setting debounce for save...");
            const delaySave = setTimeout(() => {
                saveStudentAnswersToDb();
            }, 1500); // Debounce by 1.5 seconds

            return () => clearTimeout(delaySave);
        } else if (submissionId && Object.keys(studentAnswers).length === 0) {
            // This case handles the very first save for a new submission (empty answers map)
            // Or if answers were cleared. We might want to save an empty map too.
            // Let's ensure the initial empty map is also saved if it's a new submission.
            // A simple check like 'if it's a new submission and this is the first time submissionId is set'
            // might be handled implicitly by the initial setDoc.
            // For now, only saving if answers length > 0, to avoid saving an empty object repeatedly.
            console.log("[Auto-Save Effect] Skipping debounce for empty answers (initial load).");
        }
    }, [studentAnswers, submissionId, saveStudentAnswersToDb]);


    // Fetches exam data AND handles initial submission setup
    // This effect now has significantly reduced dependencies, preventing re-runs
    useEffect(() => {
        const fetchExamDataAndSetupSubmission = async () => {
            console.log("[Setup] Starting fetchExamDataAndSetupSubmission.");
            if (isAuthLoading || !user) {
                if (!isAuthLoading && !user) {
                    console.log("[Setup] User not authenticated, redirecting to login.");
                    navigate("/student-login");
                }
                return;
            }

            // --- SECURITY CHECK: Verify exam unlocked token ---
            // Consistent: Use user.id
            const unlockedKey = user?.id ? `examUnlocked-${user.id}-${examId}` : null;
            console.log(`[Setup] Checking sessionStorage key: ${unlockedKey}`);
            if (!user?.id || sessionStorage.getItem(unlockedKey) !== 'true') {
                setSnackbarMessage("Access Denied: Please unlock the exam from the list.");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
                console.log("[Setup] Access denied, redirecting to exam list.");
                handleBackToList(); // Use the stable handleBackToList
                return;
            }
            // --- END SECURITY CHECK ---

            setLoading(true);
            try {
                // 1. Fetch Exam Details
                const examRefDoc = doc(db, "exams", examId);
                const examSnap = await getDoc(examRefDoc);

                if (!examSnap.exists()) {
                    setSnackbarMessage("Exam not found.");
                    setSnackbarSeverity("error");
                    setSnackbarOpen(true);
                    console.log("[Setup] Exam not found, redirecting.");
                    handleBackToList(); // Use the stable handleBackToList
                    return;
                }

                const examData = examSnap.data();
                // Ensure the exam is available and matches the student's intake
                if (!examData.isAvailable || examData.intakeId !== user.intake) {
                    setSnackbarMessage("Exam not available or not assigned to your intake.");
                    setSnackbarSeverity("error");
                    setSnackbarOpen(true);
                    console.log("[Setup] Exam not available for this intake, redirecting.");
                    handleBackToList(); // Use the stable handleBackToList
                    return;
                }

                setExam({ id: examSnap.id, ...examData });
                // CRITICAL CHANGE: Stricter check for question IDs.
                // The TutorForm is now responsible for ensuring each question has a unique 'id'.
                setQuestions(examData.questions.map(q => {
                    if (!q.id) {
                        console.error(`[StudentTakeExam] Question at index ${examData.questions.indexOf(q)} is missing a unique 'id'. This should be generated in TutorForm. Answer persistence for this question may be unreliable.`);
                        // Instead of generating a random ID, we now use the potentially undefined q.id
                        // This forces the issue to be addressed at the source (TutorForm/Firestore data).
                        return { ...q, id: q.id }; 
                    }
                    return { ...q, id: q.id };
                }));
                console.log("[Setup] Exam details fetched and questions set.");

                // 2. Determine Submission Document ID and Fetch/Create
                // Consistent: Use user.id
                const studentSubmissionDocId = `${examId}_${user.id}`; // Predictable ID
                const submissionDocRef = doc(db, "examSubmissions", studentSubmissionDocId);
                console.log(`[Setup] Attempting to fetch submission with predictable ID: ${studentSubmissionDocId}`);
                const existingSubmissionSnap = await getDoc(submissionDocRef);

                if (existingSubmissionSnap.exists()) {
                    const existingSubmission = { id: existingSubmissionSnap.id, ...existingSubmissionSnap.data() };
                    console.log(`[Setup] Found existing submission: ${existingSubmission.id}, isSubmitted: ${existingSubmission.isSubmitted}`);
                    
                    if (existingSubmission.isSubmitted) {
                        setSnackbarMessage("This exam has already been submitted and cannot be re-taken.");
                        setSnackbarSeverity("warning");
                        setSnackbarOpen(true);
                        console.log("[Setup] Exam already submitted, redirecting to exam list.");
                        handleBackToList();
                        return;
                    } else {
                        // Resume existing submission
                        setSubmissionId(existingSubmission.id);
                        setStudentAnswers(existingSubmission.answers || {}); // <-- LOAD PREVIOUS ANSWERS
                        console.log(`[Setup] Resuming existing submission ID: ${existingSubmission.id}. Loaded answers:`, existingSubmission.answers);

                        const durationTakenSoFar = (Date.now() - existingSubmission.startTime.toDate().getTime()) / 1000; // seconds
                        const remainingTime = (examData.duration * 60) - durationTakenSoFar;

                        if (remainingTime <= 0) {
                            setSnackbarMessage("Your exam time has expired. Submitting now...");
                            setSnackbarSeverity("warning");
                            setSnackbarOpen(true);
                            console.log("[Setup] Exam time expired, auto-submitting.");
                            await handleSubmitExam(existingSubmission.id, examData.duration * 60, existingSubmission.answers, 0);
                            return; // Prevent setting timer if already expired
                        }
                        setTimeLeft(Math.max(0, Math.floor(remainingTime)));
                        examStartTimeRef.current = existingSubmission.startTime.toDate().getTime();

                        setSnackbarMessage(`Resuming Exam '${examData.title}'!`);
                        setSnackbarSeverity("info");
                        setSnackbarOpen(true);
                    }
                } else {
                    // Create new submission with predictable ID
                    console.log(`[Setup] No existing submission found with ID ${studentSubmissionDocId}. Creating new submission.`);
                    const newSubmissionData = {
                        examId: examId,
                        // Consistent: Use user.id
                        studentId: user.id,
                        studentName: user.name || user.email,
                        intakeId: user.intake,
                        answers: {}, // Start with empty answers
                        startTime: serverTimestamp(),
                        isSubmitted: false,
                        durationTaken: 0,
                    };
                    await setDoc(submissionDocRef, newSubmissionData); // Use setDoc with predictable ID
                    setSubmissionId(studentSubmissionDocId);
                    setTimeLeft(examData.duration * 60);
                    examStartTimeRef.current = Date.now();
                    
                    setSnackbarMessage(`Starting New Exam: '${examData.title}'!`);
                    setSnackbarSeverity("success");
                    setSnackbarOpen(true);
                    console.log(`[Setup] Created new submission ID: ${studentSubmissionDocId}`);
                }
            } catch (error) {
                console.error("[Setup] Error setting up exam:", error);
                setSnackbarMessage("Failed to load exam. Please try again.");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
                handleBackToList();
            } finally {
                setLoading(false);
                console.log("[Setup] Finished fetchExamDataAndSetupSubmission.");
            }
        };

        fetchExamDataAndSetupSubmission();

        // Cleanup function for when component unmounts
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            console.log("[Cleanup] StudentTakeExam component unmounted. Timer cleared.");
        };
    }, [examId, user, isAuthLoading, navigate, handleBackToList, isQuestionAnswered]); // Added isQuestionAnswered to dependencies

    // Timer setup logic (runs once when conditions met, then cleans up only on unmount/conditions false)
    useEffect(() => {
        if (!loading && exam && submissionId && timeLeft > 0) { // Check if initial timeLeft is > 0
            console.log("Starting timer interval.");
            // Clear any existing interval before setting a new one (important for re-renders if dependencies change)
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            intervalRef.current = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) { // Check if it's about to hit zero
                        clearInterval(intervalRef.current); // Clear here to prevent negative time
                        intervalRef.current = null; // Important to reset the ref
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }
        return () => {
            console.log("Cleaning up timer interval.");
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null; // Important to reset the ref
            }
        };
    }, [loading, exam, submissionId, timeLeft]); // Added timeLeft to dependencies for accurate cleanup

    // Auto-submission when time runs out (separate effect)
    useEffect(() => {
        // Trigger auto-submit when timeLeft becomes 0, and not already submitting/dialogs open
        if (timeLeft === 0 && !loading && exam && submissionId && !submitDialogOpen && !finishEarlyDialogOpen) {
            console.log("Time's up! Auto-submitting exam.");
            // Call handleSubmitExam with the latest values from refs
            handleSubmitExam(submissionIdRef.current, examRef.current?.duration * 60, studentAnswersRef.current, 0); 
        }
    }, [timeLeft, loading, submitDialogOpen, finishEarlyDialogOpen, handleSubmitExam, exam, submissionId]); // Added exam, submissionId for clarity and correct triggering

    // Handles answer changes from StudentQuestionDisplay
    const handleAnswerChange = useCallback((questionId, answer) => {
        setStudentAnswers((prevAnswers) => ({
            ...prevAnswers,
            [questionId]: answer,
        }));
    }, []);

    // New function to clear the response for the current question
    const handleClearResponse = useCallback(() => {
        const currentQuestionId = questions[currentQuestionIndex]?.id;
        if (currentQuestionId) {
            setStudentAnswers((prevAnswers) => {
                const newAnswers = { ...prevAnswers };
                delete newAnswers[currentQuestionId]; // Remove the answer for the current question
                return newAnswers;
            });
            setSnackbarMessage("Response cleared for this question.");
            setSnackbarSeverity("info");
            setSnackbarOpen(true);
            saveStudentAnswersToDb(); // Trigger immediate auto-save for the cleared response
        }
    }, [currentQuestionIndex, questions, saveStudentAnswersToDb]);


    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
        }
    };

    const handleFinishEarly = () => {
        setFinishEarlyDialogOpen(true);
    };

    const handleConfirmFinishEarly = () => {
        setFinishEarlyDialogOpen(false);
        setSubmitDialogOpen(true); // Open final submission confirmation
    };

    // Global loading for initial auth and exam data fetch
    if (loading || isAuthLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f0f4f8">
                <CircularProgress sx={{ color: '#673ab7' }} />
                <Typography variant="body1" sx={{ ml: 2, color: '#673ab7' }}>
                    Loading exam...
                </Typography>
            </Box>
        );
    }

    if (!exam || questions.length === 0) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f0f4f8" p={4}>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    Exam not found or data missing.
                </Typography>
                <Button
                    variant="contained"
                    onClick={handleBackToList} // Use the new handler here
                    startIcon={<ArrowBackIcon />}
                    sx={{ borderRadius: '12px', bgcolor: '#673ab7', '&:hover': { bgcolor: '#5e35b1' } }}
                >
                    Back to Exam List
                </Button>
            </Box>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const answeredCount = questions.filter(q => isQuestionAnswered(q, studentAnswers)).length; // Count actually answered questions
    const totalQuestions = questions.length;

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', // This will center the Grid container
                py: { xs: 2, md: 4 },
                px: { xs: 1, md: 2 }
            }}
        >
            <Grid container spacing={3} sx={{ width: '100%', maxWidth: 1200, mt: 2, mb: 4 }}>
                {/* Left Sidebar for Question Navigation */}
                <Grid item xs={4} sm={3} md={2} sx={{ alignSelf: 'flex-start' }}> {/* ⭐ Changed xs={12} to xs={4} */}
                    <Paper
                        elevation={3}
                        sx={{
                            p: 2,
                            borderRadius: '16px',
                            bgcolor: '#ffffff',
                            position: { sm: 'sticky' }, // Make sticky on small screens and up
                            top: { sm: 20 }, // Adjust sticky position
                            maxHeight: { sm: 'calc(100vh - 40px)' }, // Max height for scrolling
                            overflowY: 'auto', // Enable vertical scrolling
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            display: 'flex', // Make the Paper a flex container
                            flexDirection: 'column', // Stack its direct children vertically
                            height: '100%', // Ensure Paper takes full height of its Grid cell
                        }}
                    >
                        {/* Box to group Title and Legend, always appearing first */}
                        <Box sx={{ mb: 2 }}> {/* Margin bottom to separate from buttons */}
                            <Typography variant="h6" fontWeight="bold" gutterBottom color="#3f51b5">
                                Questions
                            </Typography>
                            {/* Legend items, stacked vertically and aligned */}
                            <Box sx={{ 
                                mt: 1, // Reduced mt to bring closer to title
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: { xs: 'center', sm: 'flex-start' } // Align children (Typography)
                            }}>
                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box component="span" sx={{ display: 'inline-block', width: 12, height: 12, borderRadius: '4px', bgcolor: '#66bb6a', mr: 0.5 }}></Box> Answered
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                                    <Box component="span" sx={{ display: 'inline-block', width: 12, height: 12, borderRadius: '4px', bgcolor: '#bdbdbd', mr: 0.5 }}></Box> Unanswered
                                </Typography>
                            </Box>
                        </Box>
                        
                        {/* Box for question buttons - now always below the grouped title/legend */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                            {questions.map((q, index) => {
                                const answered = isQuestionAnswered(q, studentAnswers);
                                const isCurrent = index === currentQuestionIndex;
                                return (
                                    <Tooltip key={q.id} title={answered ? "Answered" : "Not Answered"}>
                                        <Button
                                            variant="contained"
                                            onClick={() => setCurrentQuestionIndex(index)}
                                            sx={{
                                                minWidth: '38px', // Fixed width for squares
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '8px',
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                                bgcolor: isCurrent ? '#3f51b5' : (answered ? '#66bb6a' : '#bdbdbd'), // Blue for current, green for answered, grey for unanswered
                                                color: isCurrent ? 'white' : (answered ? 'white' : '#424242'),
                                                '&:hover': {
                                                    bgcolor: isCurrent ? '#303f9f' : (answered ? '#43a047' : '#9e9e9e'),
                                                },
                                                transition: 'background-color 0.2s ease-in-out',
                                            }}
                                        >
                                            {index + 1}
                                        </Button>
                                    </Tooltip>
                                );
                            })}
                        </Box>
                    </Paper>
                </Grid>

                {/* Main Exam Content Area */}
                <Grid item xs={8} sm={9} md={10}> {/* ⭐ Changed xs={12} to xs={8} */}
                    <Paper
                        elevation={6}
                        sx={{
                            width: '100%',
                            borderRadius: '20px',
                            p: { xs: 2, md: 4 },
                            mb: 3,
                            bgcolor: '#ffffff',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackIcon />}
                                onClick={handleBackToList}
                                sx={{
                                    borderColor: '#388e3c', color: '#388e3c', borderRadius: '12px', fontWeight: 'bold',
                                    '&:hover': { backgroundColor: '#e8f5e9' },
                                }}
                            >
                                Back to List
                            </Button>
                            <Typography variant="h5" component="h1" fontWeight="bold" color="#388e3c" flexGrow={1} textAlign="center">
                                {exam.title}
                            </Typography>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1,
                                    minWidth: 100,
                                    textAlign: 'center',
                                    borderRadius: '10px',
                                    bgcolor: timeLeft <= 60 ? '#ffebee' : '#f1f8e9', // Redder if less than 1 min
                                    borderColor: timeLeft <= 60 ? '#ef5350' : '#c8e6c9',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                }}
                            >
                                <Typography variant="h6" fontWeight="bold" color={timeLeft <= 60 ? '#ef5350' : '#2e7d32'}>
                                    {formatTime(timeLeft)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Time Left
                                </Typography>
                            </Paper>
                        </Box>

                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                bgcolor: '#e0f2f7',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: '#388e3c',
                                    borderRadius: 5,
                                },
                                mb: 2
                            }}
                        />
                        <Typography variant="body2" color="text.secondary" textAlign="right" mb={3}>
                            Question {currentQuestionIndex + 1} of {questions.length} ({answeredCount} answered)
                        </Typography>

                        {/* Question Display Area */}
                        <StudentQuestionDisplay
                            question={currentQuestion}
                            index={currentQuestionIndex}
                            studentAnswer={studentAnswers[currentQuestion.id]}
                            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                        />

                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} flexWrap="wrap" gap={2}>
                            <Button
                                variant="outlined"
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                startIcon={<NavigateBeforeIcon />}
                                sx={{
                                    borderRadius: '12px', borderColor: '#4CAF50', color: '#4CAF50', fontWeight: 'bold',
                                    '&:hover': { backgroundColor: '#e8f5e9' },
                                }}
                            >
                                Previous
                            </Button>
                            
                            {/* NEW: Clear Response Button */}
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleClearResponse}
                                startIcon={<ClearIcon />}
                                sx={{
                                    borderRadius: '12px', 
                                    borderColor: '#ef5350', 
                                    color: '#ef5350', 
                                    fontWeight: 'bold',
                                    '&:hover': { backgroundColor: '#ffebee' },
                                }}
                            >
                                Clear Response
                            </Button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => setSubmitDialogOpen(true)}
                                    startIcon={<DoneAllIcon />}
                                    sx={{
                                        borderRadius: '12px', fontWeight: 'bold',
                                        bgcolor: '#388e3c', '&:hover': { bgcolor: '#2e7d32' },
                                    }}
                                >
                                    Submit Exam
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleNextQuestion}
                                    endIcon={<NavigateNextIcon />}
                                    sx={{
                                        borderRadius: '12px', fontWeight: 'bold',
                                        bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388e3c' },
                                    }}
                                >
                                    Next Question
                                </Button>
                            )}
                        </Box>
                        <Box mt={3} textAlign="center">
                            <Button
                                variant="text"
                                color="error"
                                onClick={handleFinishEarly}
                                sx={{ borderRadius: '12px', fontWeight: 'bold' }}
                            >
                                Finish Exam Early
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Submit Confirmation Dialog */}
            <Dialog
                open={submitDialogOpen}
                onClose={() => setSubmitDialogOpen(false)}
                aria-labelledby="submit-dialog-title"
                aria-describedby="submit-dialog-description"
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' } }}
            >
                <DialogTitle id="submit-dialog-title" sx={{ fontWeight: 'bold', color: '#37474f' }}>
                    Confirm Exam Submission
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="submit-dialog-description" sx={{ color: '#546e7a' }}>
                        You are about to submit your exam. Please ensure you have answered all questions.
                        You have answered {answeredCount} out of {totalQuestions} questions.
                        Once submitted, you cannot make any further changes.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSubmitDialogOpen(false)} color="secondary" sx={{ borderRadius: '8px' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleSubmitExam()} // Call without args, relying on refs
                        color="primary"
                        variant="contained"
                        sx={{ borderRadius: '8px', fontWeight: 'bold' }}
                        autoFocus
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Finish Early Confirmation Dialog */}
            <Dialog
                open={finishEarlyDialogOpen}
                onClose={() => setFinishEarlyDialogOpen(false)}
                aria-labelledby="finish-early-dialog-title"
                aria-describedby="finish-early-dialog-description"
                fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' } }}
            >
                <DialogTitle id="finish-early-dialog-title" sx={{ fontWeight: 'bold', color: '#37474f' }}>
                    Finish Exam Early?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="finish-early-dialog-description" sx={{ color: '#546e7a' }}>
                        Are you sure you want to finish the exam early? You have {formatTime(timeLeft)} remaining.
                        You can still review your answers.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setFinishEarlyDialogOpen(false)} color="secondary" sx={{ borderRadius: '8px' }}>
                        Keep Working
                    </Button>
                    <Button
                        onClick={handleConfirmFinishEarly}
                        color="warning"
                        variant="contained"
                        sx={{ borderRadius: '8px', fontWeight: 'bold' }}
                        autoFocus
                    >
                        Yes, Finish Early
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <MuiAlert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    elevation={6}
                    variant="filled"
                    sx={{
                        backgroundColor: snackbarSeverity === "error" ? "#ef5350" : (snackbarSeverity === "info" ? "#2196f3" : "#81c784"),
                        fontWeight: 'bold',
                        borderRadius: '8px',
                    }}
                >
                    {snackbarMessage}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
};

export default StudentTakeExam;
