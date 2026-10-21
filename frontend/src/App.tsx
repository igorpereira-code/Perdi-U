import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import type { AppUser } from '@shared/user';
import { NotInstitutionalEmailError, type AuthService } from './core/data/authService';
import { AppLayout } from './core/presenter/AppLayout';
import { LoginPage } from './core/presenter/LoginPage';
import { ProfilePage } from './core/presenter/ProfilePage';
import type { MatchesService } from './matching/data/matchesService';
import { MatchesScreen } from './matching/presenter/MatchesScreen';
import type { WelfareService } from './welfare/data/welfareService';
import { WelfarePage } from './welfare/presenter/WelfarePage';

import { HomeScreen } from './owner/presenter/HomeScreen';
import { MyLostReportsPage, type LostReportSummary } from './owner/presenter/MyLostReportsPage';
import { LostReportDetailPage } from './owner/presenter/LostReportDetailPage';
import { NewLostReportPage, type LostReportSubmitData } from './owner/presenter/NewLostReportPage';
import { LostReportConfirmation } from './owner/presenter/LostReportConfirmation';
import { FoundObjectDetailPage, type FoundObjectDetail } from './owner/presenter/FoundObjectDetailPage';

import type { OwnerService } from './owner/data/ownerService';

type AppProps = {
  authService: AuthService;
  matchesService: MatchesService;
  ownerService: OwnerService;
  welfareService: WelfareService;
};

export default function App({ authService, matchesService, ownerService, welfareService }: AppProps) {
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);
  const [notInstitutional, setNotInstitutional] = useState(false);
  const [lastReportCode, setLastReportCode] = useState('');
  
  const [selectedFoundObject, setSelectedFoundObject] = useState<FoundObjectDetail | null>(null);
  const [selectedMyReport, setSelectedMyReport] = useState<LostReportSummary | null>(null);
  
  const [myReports, setMyReports] = useState<LostReportSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch((error: unknown) => {
        setNotInstitutional(error instanceof NotInstitutionalEmailError);
        setUser(null);
      });
  }, [authService]);

  useEffect(() => {
    if (user) {
      ownerService.getMyLostReports()
        .then(setMyReports)
        .catch(console.error);
    }
  }, [user, ownerService]);

  async function handleSignOut() {
    await authService.signOut();
    setUser(null);
  }

  const handleLostReportSubmit = async (data: LostReportSubmitData) => {
    try {
      const response = await ownerService.createLostReport(data);
      setLastReportCode(response.code);
      
      const updatedReports = await ownerService.getMyLostReports();
      setMyReports(updatedReports);
      
      navigate('/reporte-confirmado');
    } catch (error) {
      console.error("Error al enviar el reporte", error);
      alert("Hubo un problema al guardar el reporte.");
    }
  };

  const signedInPage = (page: (me: AppUser) => ReactNode) => {
    if (user === undefined) return null;
    if (user === null) return <Navigate to="/ingresar" replace />;
    return <AppLayout>{page(user)}</AppLayout>;
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={signedInPage((me) => (
          <div className="flex flex-col w-full min-h-screen bg-neutral-50 pb-20">
            <div className="flex flex-col items-center text-center px-4 pt-8 pb-6 max-w-lg mx-auto w-full">
              <p className="text-sm text-neutral-500 mb-1">
                ¡Hola, {me.name.split(' ')[0]}! 
              </p>
              <h1 className="text-2xl font-bold text-blue-950 mb-2">
                ¿Lo perdi-U? <span className="bg-[#facc15] px-2 py-0.5 rounded-sm">¡Lo encontr-U!</span>
              </h1>
              <p className="text-sm text-neutral-500">
                Si lo pierdes, te ayudamos a encontrarlo.
              </p>
            </div>

            <div className="flex-1">
              <HomeScreen 
                onNavigateToLost={() => navigate('/reportar-perdida')}
                recentFoundObjects={[
                  { id: '1', code: 'EN-0001', description: 'Mochila negra con llavero', category: 'Mochilas y bolsos', place: 'Biblioteca', status: 'PUBLISHED', foundDate: '2026-10-17' },
                  { id: '2', code: 'EN-0002', description: 'Termo metálico azul', category: 'Botellas y termos', place: 'Bloque A', status: 'PUBLISHED', foundDate: '2026-10-18' }
                ]}
                onSelectObject={(obj) => {
                  setSelectedFoundObject(obj as FoundObjectDetail);
                  navigate('/objeto-encontrado');
                }}
              />
            </div>
          </div>
        ))} 
      />

      <Route path="/perfil" element={signedInPage((me) => <ProfilePage user={me} onSignOut={handleSignOut} />)} />
      <Route path="/mis-reportes/:code/coincidencias" element={signedInPage(() => <MatchesScreen matchesService={matchesService} />)} />
      <Route path="/ingresar" element={<LoginPage onGoogleLogin={authService.signIn} notInstitutional={notInstitutional} />} />
      
      <Route
        path="/objeto-encontrado"
        element={signedInPage(() => (
          <FoundObjectDetailPage 
            object={selectedFoundObject!}
            onBack={() => window.history.back()} 
          />
        ))}
      />

      <Route
        path="/reportar-perdida"
        element={signedInPage(() => (
          <NewLostReportPage 
            onBack={() => navigate('/')} 
            onSubmit={handleLostReportSubmit} 
          />
        ))}
      />
      
      <Route
        path="/reporte-confirmado"
        element={signedInPage(() => (
          <LostReportConfirmation 
            reportCode={lastReportCode || 'PR-0001'} 
            onGoHome={() => navigate('/')} 
          />
        ))}
      />
      
      <Route
        path="/mis-reportes"
        element={signedInPage(() => (
          <MyLostReportsPage 
            reports={myReports} 
            onBack={() => navigate('/')} 
            onSelectReport={(report) => {
              setSelectedMyReport(report);
              navigate('/mis-reportes/detalle');
            }}
          />
        ))}
      />
      
      <Route
        path="/mis-reportes/detalle"
        element={signedInPage(() => (
          <LostReportDetailPage 
            report={{
              id: selectedMyReport?.id || '1',
              code: selectedMyReport?.code || 'PR-0000',
              description: selectedMyReport?.description || 'Objeto sin descripción',
              category: 'Categoría', 
              place: 'Lugar',
              date: '2026-10-20',
              status: selectedMyReport?.status || 'SEARCHING'
            }}
            onBack={() => window.history.back()} 
          />
        ))}
      />

      <Route
        path="/bienestar"
        element={signedInPage((me) =>
          me.role === 'WELFARE' ? (
            <WelfarePage welfareService={welfareService} matchesService={matchesService} />
          ) : (
            <Navigate to="/" replace />
          ),
        )}
      />
    </Routes>
  );
}