import { pdfjs, Document, Page } from 'react-pdf'
import styles from '../styles/Home.module.css';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useResizeDetector } from 'react-resize-detector';
import { Row } from 'antd';
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { setNumberOfSlides } from '../app/appStateSlice';
import {
  useFetchPresentationStatsByIdQuery,
} from '../app/presentationStatsFirestore';
import { skipToken } from '@reduxjs/toolkit/dist/query/react';

  pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/static/js/pdf.worker.min.js`

  export default function PDFViewer(props: {presenterView: boolean}) {
    const { width, ref } = useResizeDetector();
    const dispatch = useAppDispatch()
    const sessionId = useAppSelector((state) => state.appState.sessionId);
    const { data } = useFetchPresentationStatsByIdQuery(sessionId ?? skipToken);
  
    function onDocumentLoadSuccess({ numPages: nextNumPages }: PDFDocumentProxy) {
      dispatch(setNumberOfSlides(nextNumPages))
    }    
  
    return (
      <div style={{width: '100%'}}>
        <Row>
          <div ref={ref} id="documentWrapper" style={{width: '100%', height: '100%'}} >
              <Document file={data?.presentationUrl} onLoadSuccess={onDocumentLoadSuccess}>
                <Page
                  pageNumber={data?.currentSlideNumber}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  className={styles.slide}
                  width={width}
                />
              </Document>
          </div>
        </Row>
        </div>
    );
  }
  