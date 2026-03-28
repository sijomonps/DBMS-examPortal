import { 
    collection, doc, getDocs, getDoc, setDoc, query, where, addDoc, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './config.js';

// ---- STUDENT FUNCTIONS ----

// Verify exam password and return exam info if correct
export async function verifyExamPassword(password) {

    const examsRef = collection(db, 'exams');
    const q = query(examsRef, where('password', '==', password));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return null;
    }
    
    const docData = querySnapshot.docs[0];
    return {
        id: docData.id,
        ...docData.data()
    };
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
        
        // We ensure document exists first or merge fields
        const docSnap = await getDoc(submissionRef);
        
        let answersArr = [];
        if (docSnap.exists()) {
            answersArr = docSnap.data().answers || [];
        }
        
        answersArr[questionIndex] = answerSql;
        
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
    try {

        const submissionRef = doc(db, 'submissions', examId, 'students', studentName);
        await setDoc(submissionRef, {
            submittedAt: serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.warn("Submission finalize deferred:", err);
    }
}


// ---- ADMIN FUNCTIONS ----

export async function createExam(title, password, questions, durationMinutes = 60) {

    const examsRef = collection(db, 'exams');
    await addDoc(examsRef, {
        title,
        password,
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
    const docRef = doc(db, 'exams', examId);
    await setDoc(docRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
}

export async function getExamsList() {

    const examsRef = collection(db, 'exams');
    const snapshot = await getDocs(examsRef);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
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
