import {
  arrayUnion,
  collection,
  doc,
  updateDoc,
  query,
  onSnapshot
} from 'firebase/firestore';

import { firestoreApi } from './firestoreApi';
import { firestore } from '../firebase';

// Define a type for the slice state
export interface PresentationData {
  id?: string;
  currentSlideNumber: number;
  presentationFinished: boolean;
  presentationUrl: string
}


export const presentationStatsApi = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchPresentationStatsById: builder.query<PresentationData, string>({
      async queryFn(roomId) {
        try {
          return new Promise((resolve, reject) => {
            onSnapshot(collection(firestore, roomId),(querySnapshot)=>{

              let item = querySnapshot.docs[0];
              if (item) {
                let res = { id: item.id, ...item.data() } as PresentationData;
                resolve({ data : res});
              } else {
                console.error('Session not found')
                resolve({ error: 'Session not found' });
              }    
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
            collection(firestore, roomId)
          );
          unsubscribe = onSnapshot(dbRef, (snapshot) => {
            let item = snapshot.docs[0];
            let res = { id: item.id, ...item.data() } as PresentationData;

            updateCachedData((draft) => {             
              console.log('update', draft, res)
              return res
            });
          });
        } catch {}
        await cacheEntryRemoved;
        unsubscribe();
      },
      providesTags: ['CurrentSlideNumber'],
    }),
    setPresentationStats: builder.mutation({
      async queryFn({ roomId, nextSlideNumber, presentationFinished }) {
        try {
          console.log("update", nextSlideNumber, arrayUnion({currentSlideNumber: nextSlideNumber}), )
          if (presentationFinished !== undefined) {
            await updateDoc(doc(firestore, roomId, 'presentationStats'), {
              currentSlideNumber: nextSlideNumber,
              presentationFinished: presentationFinished
            });
          } else {
            await updateDoc(doc(firestore, roomId, 'presentationStats'), {
              currentSlideNumber: nextSlideNumber,
            });
          }
          
          return { data: null };
        } catch (error: any) {
          console.error(error.message);
          return { error: error.message };
        }
      },
      invalidatesTags: ['CurrentSlideNumber'],
    }),
  }),
});

export const {
  useFetchPresentationStatsByIdQuery,
  useSetPresentationStatsMutation,
} = presentationStatsApi;