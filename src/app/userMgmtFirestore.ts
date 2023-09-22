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
    // fetchUserList: builder.query<any, string>({
    //   async queryFn(roomId) {
    //     try {
    //       const ref = collection(firestore, roomId, 'users', 'usersList');
    //       const querySnapshot = await getDocs(ref);
    //       let scoresTables: any = [];
    //       querySnapshot?.forEach((doc) => {
    //         console.log('user', doc)
    //       });
    //       return { data: scoresTables };
    //     } catch (error: any) {
    //       console.error(error.message);
    //       return { error: error.message };
    //     }
    //   },
    //   providesTags: ['UserList'],
    // }),
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
            /*statusLog: {}*/
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
              "status": status,
              "engagement": engagement,
              "confusion": confusion,
              "faceDetected": faceDetected,
              /*[`statusLog.${currentSlide}`]: status,*/
              });
          }
          
          // const statusLog = Object.assign({...user.statusLog, [currentSlide]:status})

          // optimistic return
          const returnUser: UserData = {
            id: user.id,
            name: user.name,
            online: user.online,
            engagement: engagement,
            confusion: confusion,
            presenter: user.presenter,
            faceDetected: faceDetected,
            /*statusLog: statusLog*/
          }; 
          console.log('setting status ', status, user, returnUser )
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
  useFetchUserByIdQuery
} = userMgmtApi;