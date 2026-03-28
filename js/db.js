import { 
    collection, doc, getDocs, getDoc, setDoc, query, where, addDoc, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDb } from './config.js';

// ---- STUDENT FUNCTIONS ----

// Verify exam password and return exam info if correct
export async function verifyExamPassword(password) {
    const db = getDb();
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
    const db = getDb();
    const docRef = doc(db, 'exams', examId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().questions || [];
    }
    return [];
}

export async function saveStudentAnswer(examId, studentName, questionIndex, answerSql) {
    // 1. Save to localStorage as immediate offline backup
    const lsKey = `sqlab_answers_${examId}_${studentName}`;
    let answersObj = JSON.parse(localStorage.getItem(lsKey) || '{}');
    answersObj[questionIndex] = answerSql;
    localStorage.setItem(lsKey, JSON.stringify(answersObj));
    
    // 2. Queue write to Firestore (handled automatically by offline persistence)
    try {
        const db = getDb();
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
        const db = getDb();
        const submissionRef = doc(db, 'submissions', examId, 'students', studentName);
        await setDoc(submissionRef, {
            submittedAt: serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.warn("Submission finalize deferred:", err);
    }
}


// ---- ADMIN FUNCTIONS ----

export async function createExam(title, password, questions) {
    const db = getDb();
    const examsRef = collection(db, 'exams');
    await addDoc(examsRef, {
        title,
        password,
        questions,
        createdAt: serverTimestamp()
    });
}

export async function getExamsList() {
    const db = getDb();
    const examsRef = collection(db, 'exams');
    const snapshot = await getDocs(examsRef);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

export async function getSubmissionsForExam(examId) {
    const db = getDb();
    const studentsRef = collection(db, 'submissions', examId, 'students');
    const snapshot = await getDocs(studentsRef);
    return snapshot.docs.map(doc => ({
        studentName: doc.id,
        ...doc.data()
    }));
}

export async function saveMarks(examId, studentName, marksArray) {
    const db = getDb();
    const submissionRef = doc(db, 'submissions', examId, 'students', studentName);
    await updateDoc(submissionRef, {
        marks: marksArray
    });
}
