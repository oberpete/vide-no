import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  onSnapshot,
  DocumentReference,
  where
} from 'firebase/firestore';

import { firestoreApi } from './firestoreApi';
import { firestore } from '../firebase';
import { UserData } from '../types';


export const userMgmtApi = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchUserListByRoomId: builder.query<UserData[], string>({
      async queryFn(roomId) {
        try {
          return new Promise((resolve, reject) => {
            onSnapshot(collection(firestore, roomId, 'users', 'userList'),(querySnapshot)=>{
              let userList: UserData[] = []
              querySnapshot.docs.map((item) => {
                userList.push({ id: item.id, ...item.data()} as UserData)
              })
                console.log('user data list', userList)
               resolve({ data : userList});
            })})
        } catch (error: any) {
          console.error(error.message);
          return { error: error.message };
        }
      },
      async onCacheEntryAdded(
        roomId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;
          const dbRef = query(
            collection(firestore, roomId, 'users', 'userList')
          );
          unsubscribe = onSnapshot(dbRef, (snapshot) => {
            let userList: UserData[] = [];
            let item = snapshot.docs.map((item) => {
              userList.push({ id: item.id, ...item.data()} as UserData)
              return userList;
            })
            

            updateCachedData((draft) => {
              return userList;
            });
          });
        } catch {}
        await cacheEntryRemoved;
        unsubscribe();
      },
      providesTags: ['User'],
    }),

    addUser: builder.mutation({
      async queryFn({ roomId, name, presenterMode }) {
        try {

          const docRef: DocumentReference = await addDoc(collection(firestore, roomId, "users", "userList"), {
            name: name,
            online: true,
            status: "sleeping",
            presenter: presenterMode
          })
          console.log("DocRef", docRef);

          const user: UserData = {
            id: docRef.id,
            name: name,
            online: true,
            engagement: 1,
            confusion: 1,
            faceDetected: false,
            presenter: presenterMode,
            statusLog: {},
            feedbackLogGeneral: {},
            feedbackLogConfusion: {},
          }; 

          return { data: user };
        } catch (error: any) {
          console.error(error.message);
          return { error: error.message };
        }
      },
      invalidatesTags: ['User'],
    }),
    setUserStatus: builder.mutation<UserData, {roomId: string, user: UserData, status: string, currentSlide: number, engagement: number, confusion: number, faceDetected: boolean}>({
      async queryFn({ roomId, user, status, currentSlide, engagement, confusion, faceDetected }) {
        try {
          if (user.id) {
            const userDocRef = doc(firestore, roomId, "users", "userList", user.id);
            const result = await updateDoc(userDocRef, {
              "engagement": engagement,
              "confusion": confusion,
              "faceDetected": faceDetected,
              /*[`statusLog.${currentSlide}`]: status,*/
              });
          }
          
          const statusLog = Object.assign({...user.statusLog, [currentSlide]:status})

          // optimistic return
          const returnUser: UserData = {
            id: user.id,
            name: user.name,
            online: user.online,
            engagement: engagement,
            confusion: confusion,
            presenter: user.presenter,
            faceDetected: faceDetected,
            statusLog: statusLog,
            feedbackLogConfusion: user.feedbackLogConfusion,
            feedbackLogGeneral: user.feedbackLogGeneral
            
          }; 
          console.log('[FireStore] update User ', user, returnUser )
          return { data: returnUser };
        } catch (error: any) {
          console.error(error.message);
          return { error: error.message };
        }
      },
      invalidatesTags: ['User'],
    }),
    setFeedbackGeneral: builder.mutation<UserData, {roomId: string, user: UserData, feedbackGeneral: number, currentSlide: number}>({
      async queryFn({ roomId, user, feedbackGeneral, currentSlide }) {
        try {
          if (user.id) {
            const userDocRef = doc(firestore, roomId, "users", "userList", user.id);
            const result = await updateDoc(userDocRef, {
              [`feedbackLogGeneral.${currentSlide}`]: feedbackGeneral,
            });
          }
          
          const feedbackLogGeneral = Object.assign({...user.feedbackLogGeneral, [currentSlide]:feedbackGeneral})

          // optimistic return
          const returnUser: UserData = {
            id: user.id,
            name: user.name,
            online: user.online,
            engagement: user.engagement,
            confusion: user.confusion,
            presenter: user.presenter,
            faceDetected: user.faceDetected,
            statusLog: user.statusLog,
            feedbackLogConfusion: user.feedbackLogConfusion,
            feedbackLogGeneral: feedbackLogGeneral
            
          };     

          return { data: returnUser };
        } catch (error: any) {
          console.error(error.message);
          return { error: error.message };
        }
      },
      invalidatesTags: ['User'],
    }),

    setFeedbackConfusion: builder.mutation<UserData, {roomId: string, user: UserData, feedbackConfusion: number, currentSlide: number}>({
      async queryFn({ roomId, user, feedbackConfusion, currentSlide }) {
        try {
          if (user.id) {
            const userDocRef = doc(firestore, roomId, "users", "userList", user.id);
            const result = await updateDoc(userDocRef, {
              [`feedbackLogConfusion.${currentSlide}`]: feedbackConfusion,
            });
          }
          
          const feedbackLogConfusion = Object.assign({...user.feedbackLogConfusion, [currentSlide]:feedbackConfusion})

          // optimistic return
          const returnUser: UserData = {
            id: user.id,
            name: user.name,
            online: user.online,
            engagement: user.engagement,
            confusion: user.confusion,
            presenter: user.presenter,
            faceDetected: user.faceDetected,
            statusLog: user.statusLog,
            feedbackLogConfusion: feedbackLogConfusion,
            feedbackLogGeneral: user.feedbackLogGeneral
            
          };     
          

          return { data: returnUser };
        } catch (error: any) {
          console.error(error.message);
          return { error: error.message };
        }
      },
      invalidatesTags: ['User'],
    }),
    
    fetchUserById: builder.query<UserData, {roomId: string, userId: string}>({
      async queryFn({ roomId, userId }) {
        try {
            
          const userDocRef = doc(firestore, roomId, "users", "userList", userId);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            console.log("User Found:", docSnap.data());
            let user = {id: docSnap.id, ...docSnap.data()} as UserData;
            // if (!user.statusLog) {
            //   user.statusLog = {}
            // }
            console.log('user', user)
            return ({ data: user })
          } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document!");
            return ({data: undefined})
          }
          
          // const userListRef = collection(firestore, roomId, "users", "userList");
          // const q = query(userListRef, where("id", "==", userId));
          // var res: UserData[] = [];
          // const querySnapshot = await getDocs(q);
          // console.log('querySnapshot', querySnapshot)
          // querySnapshot.forEach((doc) => {
          //   console.log(doc.id, " => ", doc.data());
          //   res.push({id: doc.id, ...doc.data()} as UserData);
          // });         
          // return ({data: res[0] })
    
        } catch (error: any) {
          console.error(error.message);
          return { error: error.message };
        }
  }})
  }),
});

export const {
  useFetchUserListByRoomIdQuery,
  useAddUserMutation,
  useSetUserStatusMutation,
  useSetFeedbackGeneralMutation,
  useSetFeedbackConfusionMutation,
  useFetchUserByIdQuery
} = userMgmtApi;