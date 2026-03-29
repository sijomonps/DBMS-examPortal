import { 
    collection, doc, getDocs, getDoc, setDoc, query, where, addDoc, serverTimestamp, updateDoc, waitForPendingWrites, deleteDoc, writeBatch, getDocsFromServer
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './config.js';

// ---- STUDENT FUNCTIONS ----

// Verify exam password and return exam info if correct
export async function verifyExamPassword(password) {
    const normalizedPassword = String(password || '').trim();
    if (!normalizedPassword) {
        return null;
    }

    const examsRef = collection(db, 'exams');
    const q = query(examsRef, where('password', '==', normalizedPassword));

    let querySnapshot;
    try {
        // Prefer server data so recently deleted exams are not selected from stale local cache.
        querySnapshot = await getDocsFromServer(q);
    } catch (err) {
        console.warn('Server fetch failed for password verification, falling back to cached data:', err);
        querySnapshot = await getDocs(q);
    }
    
    if (querySnapshot.empty) {
        return null;
    }

    const activeExams = querySnapshot.docs
        .map(docSnapshot => ({
            id: docSnapshot.id,
            ...docSnapshot.data()
        }))
        .filter(exam => !exam.deleted);

    if (activeExams.length === 0) {
        return null;
    }

    activeExams.sort((a, b) => {
        const aUpdated = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const bUpdated = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        if (bUpdated !== aUpdated) {
            return bUpdated - aUpdated;
        }

        const aCreated = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bCreated = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bCreated - aCreated;
    });

    return activeExams[0];
}

export async function getExamQuestions(examId) {

    const docRef = doc(db, 'exams', examId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().questions || [];
    }
    return [];
}

export async function getFullExamDetails(examId) {
    const docRef = doc(db, 'exams', examId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return {
            id: docSnap.id,
            ...docSnap.data()
        };
    }
    return null;
}

export async function saveStudentAnswer(examId, studentName, questionIndex, answerSql) {
    // 1. Save to localStorage as immediate offline backup
    const lsKey = `sqlab_answers_${examId}_${studentName}`;
    let answersObj = JSON.parse(localStorage.getItem(lsKey) || '{}');
    answersObj[questionIndex] = answerSql;
    localStorage.setItem(lsKey, JSON.stringify(answersObj));
    
    // 2. Queue write to Firestore (handled automatically by offline persistence)
    try {
        const submissionRef = doc(db, 'submissions', examId, 'students', studentName);

        // Build a sparse array from locally persisted answers without requiring a Firestore read.
        const answersArr = [];
        Object.entries(answersObj).forEach(([idx, sql]) => {
            const parsed = Number(idx);
            if (Number.isFinite(parsed)) {
                answersArr[parsed] = sql;
            }
        });
        
        await setDoc(submissionRef, {
            answers: answersArr,
            lastUpdated: serverTimestamp()
        }, { merge: true });
        
        console.log("Answer saved locally/Firebase");
    } catch (err) {
        console.warn("Firestore save deferred due to offline status:", err);
    }
}

export async function submitExam(examId, studentName) {
    const submissionRef = doc(db, 'submissions', examId, 'students', studentName);
    await setDoc(submissionRef, {
        submittedAt: serverTimestamp()
    }, { merge: true });

    // Wait until local queued writes are acknowledged by backend.
    await waitForPendingWrites(db);
}


// ---- ADMIN FUNCTIONS ----

export async function createExam(title, password, questions, durationMinutes = 60) {
    const normalizedPassword = String(password || '').trim();
    if (!normalizedPassword) {
        throw new Error('Exam password is required.');
    }

    const examsRef = collection(db, 'exams');
    const existingPasswordQuery = query(examsRef, where('password', '==', normalizedPassword));

    let existingSnapshot;
    try {
        existingSnapshot = await getDocsFromServer(existingPasswordQuery);
    } catch (err) {
        console.warn('Server fetch failed for createExam duplicate check, falling back to cached data:', err);
        existingSnapshot = await getDocs(existingPasswordQuery);
    }

    const hasActiveExamWithPassword = existingSnapshot.docs.some(docSnapshot => {
        const data = docSnapshot.data();
        return !data.deleted;
    });

    if (hasActiveExamWithPassword) {
        throw new Error('Exam password already exists. Please use a different password.');
    }

    await addDoc(examsRef, {
        title,
        password: normalizedPassword,
        questions,
        durationMinutes: parseInt(durationMinutes) || 60,
        createdAt: serverTimestamp()
    });
}

export async function updateExam(examId, updates) {
    const docRef = doc(db, 'exams', examId);
    
    // Ensure durationMinutes is an integer if provided
    if (updates.durationMinutes) {
        updates.durationMinutes = parseInt(updates.durationMinutes) || 60;
    }
    
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });
}

export async function updateExamQuestions(examId, questions) {
    const docRef = doc(db, 'exams', examId);
    await updateDoc(docRef, {
        questions: questions,
        updatedAt: serverTimestamp()
    });
}

export async function deleteExam(examId) {
    const studentsRef = collection(db, 'submissions', examId, 'students');
    const studentsSnapshot = await getDocs(studentsRef);

    const batchLimit = 450;
    let batch = writeBatch(db);
    let opCount = 0;

    for (const studentDoc of studentsSnapshot.docs) {
        batch.delete(studentDoc.ref);
        opCount++;

        if (opCount >= batchLimit) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
        }
    }

    if (opCount > 0) {
        await batch.commit();
    }

    // Remove exam doc after deleting all student submission docs.
    // The parent submissions/{examId} doc is not required for this data model.
    await deleteDoc(doc(db, 'exams', examId));
}

export async function getExamsList() {

    const examsRef = collection(db, 'exams');
    const snapshot = await getDocs(examsRef);
    const examList = snapshot.docs
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        .filter(exam => !exam.deleted);

    examList.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
    });

    return examList;
}

export async function getSubmissionsForExam(examId) {
    console.log(`[DB] Fetching submissions for examId: ${examId}`);
    // Using intermediate 'students' subcollection matching Firestore's requirement for odd segment paths
    const studentsRef = collection(db, 'submissions', examId, 'students');
    console.log(`[DB] Target path: submissions/${examId}/students`);
    
    const snapshot = await getDocs(studentsRef);
    console.log(`[DB] Fetched ${snapshot.size} students under this exam.`);
    
    return snapshot.docs.map(doc => {
        const payload = doc.data();
        console.log(`[DB] Extracted student document (${doc.id}):`, payload);
        return {
            studentName: doc.id,
            ...payload
        };
    });
}

export async function saveMarks(examId, studentName, marksArray) {

    const submissionRef = doc(db, 'submissions', examId, 'students', studentName);
    await updateDoc(submissionRef, {
        marks: marksArray
    });
}
