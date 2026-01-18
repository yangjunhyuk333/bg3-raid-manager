import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Activity, Shield, Users, Clock, Trash2, FileText, Cpu } from 'lucide-react';

const SaveAnalyzer = ({ user }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Listen for real-time updates from Python Agent
        const q = query(
            collection(db, "save_reports_v2"),
            orderBy("createdAt", "desc"),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReports(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (id) => {
        if (confirm('이 분석 기록을 삭제하시겠습니까?')) {
            await deleteDoc(doc(db, "save_reports_v2", id));
        }
    };

    const StatBar = ({ label, value, color }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ width: '40px', fontWeight: 'bold', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{label}</span>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(value / 20) * 100}%`, height: '100%', background: color, transition: 'width 0.5s' }} />
            </div>
            <span style={{ width: '25px', textAlign: 'right', fontWeight: 'bold' }}>{value}</span>
        </div>
    );

    return (
        <div style={{ padding: '0 0 80px' }}>
            <div className="glass-panel" style={{ marginBottom: '20px', textAlign: 'center', border: '1px solid var(--accent-color)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Cpu color="#a78bfa" /> 실시간 세이브 분석 (자동 동기화)
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '15px 0' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#4ade80' }}>Python Agent 작동 중</span>
                </div>
                <p style={{ opacity: 0.8, fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
                    별도의 업로드가 필요 없습니다! <br />
                    게임을 <b>저장(F5)</b>하면 Python Agent가 자동으로 파일을 감지하여 이곳에 분석 결과를 표시합니다.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', opacity: 0.5 }}>데이터 수신 대기 중...</p>
                ) : reports.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
                        <FileText size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
                        <p>분석된 데이터가 없습니다.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>게임을 실행하고 저장(F5)을 해보세요!</p>
                    </div>
                ) : (
                    reports.map(report => (
                        <div key={report.id} className="glass-panel" style={{ position: 'relative', animation: 'fadeIn 0.5s' }}>
                            <button
                                onClick={() => handleDelete(report.id)}
                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                            >
                                <Trash2 size={16} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                                <FileText size={20} color="var(--accent-color)" />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{report.filename}</h3>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                                        {new Date(report.createdAt?.toDate()).toLocaleString()} • {report.uploader}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {/* Left: Stats */}
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px' }}>
                                    <h4 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                                        <Activity size={14} /> 능력치 (Stats)
                                    </h4>
                                    {report.stats ? (
                                        <>
                                            <StatBar label="STR" value={report.stats.STR} color="#fca5a5" />
                                            <StatBar label="DEX" value={report.stats.DEX} color="#86efac" />
                                            <StatBar label="CON" value={report.stats.CON} color="#fbbf24" />
                                            <StatBar label="INT" value={report.stats.INT} color="#93c5fd" />
                                            <StatBar label="WIS" value={report.stats.WIS} color="#d8b4fe" />
                                            <StatBar label="CHA" value={report.stats.CHA} color="#f472b6" />
                                        </>
                                    ) : (
                                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>데이터 없음</p>
                                    )}
                                </div>

                                {/* Right: Info & Logs */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', flex: 1 }}>
                                        <h4 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                                            <Shield size={14} /> 메타 정보
                                        </h4>
                                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <p style={{ margin: 0 }}>📂 모드: {report.meta?.mode || 'Unknown'}</p>
                                            <p style={{ margin: 0 }}>💾 버전: {report.meta?.version || 'Unknown'}</p>
                                            <p style={{ margin: 0 }}>📦 크기: {report.meta?.size || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    {/* Companions if available */}
                                    {report.companions && (
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px' }}>
                                            <h4 style={{ margin: '0 0 5px', fontSize: '0.8rem', opacity: 0.8 }}>동료 (Companions)</h4>
                                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                {report.companions.map((c, i) => (
                                                    <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                                        {c.img} {c.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Analysis Log */}
                            <div style={{ marginTop: '15px', background: '#1e1e1e', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', fontFamily: 'monospace', color: '#a78bfa' }}>
                                {report.logs?.map((log, i) => (
                                    <div key={i}>&gt; {log}</div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SaveAnalyzer;
