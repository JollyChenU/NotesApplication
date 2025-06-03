import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Chip,
    Alert,
    Paper,
    Divider,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    AutoFixHigh as AIIcon,
    CheckCircle as AcceptIcon,
    Cancel as RejectIcon,
    Compare as CompareIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Folder as FolderIcon
} from '@mui/icons-material';
import aiService from '../services/aiService';

const AIOptimizeDialog = ({ open, onClose, fileId, fileName }) => {
    const [step, setStep] = useState('collecting'); // collecting, optimizing, result
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [originalContent, setOriginalContent] = useState('');
    const [optimizedContent, setOptimizedContent] = useState('');
    const [optimizationReport, setOptimizationReport] = useState(null);
    const [tabValue, setTabValue] = useState(0); // 0: 优化, 1: 临时文件管理
    const [tempFiles, setTempFiles] = useState([]);
    const [tempFilesLoading, setTempFilesLoading] = useState(false);

    React.useEffect(() => {
        if (open && fileId) {
            handleCollectContent();
        }
    }, [open, fileId]);

    const handleCollectContent = async () => {
        setLoading(true);
        setError(null);
        setStep('collecting');

        try {
            const result = await aiService.collectFileContent(fileId);
            if (result.success) {
                setOriginalContent(result.collected_content);
                setStep('optimizing');
                await handleOptimizeContent(result.collected_content);
            } else {
                setError(result.error || '收集内容失败');
            }
        } catch (err) {
            setError('收集文件内容时发生错误: ' + err.message);
        }
        setLoading(false);
    };

    const handleOptimizeContent = async (content) => {
        setLoading(true);
        setError(null);

        try {
            const result = await aiService.optimizeContent(fileId, content, 'general');
            if (result.success) {
                setOptimizedContent(result.optimized_content);
                setOptimizationReport(result.report);
                setStep('result');
            } else {
                setError(result.error || 'AI优化失败');
            }
        } catch (err) {
            setError('AI优化时发生错误: ' + err.message);
        }
        setLoading(false);
    };

    const handleAcceptOptimization = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await aiService.applyOptimization(fileId, optimizedContent, true);
            if (result.success) {
                onClose(true); // 传递true表示已应用优化
            } else {
                setError(result.error || '应用优化失败');
            }
        } catch (err) {
            setError('应用优化时发生错误: ' + err.message);
        }
        setLoading(false);
    };

    const handleRejectOptimization = () => {
        onClose(false); // 传递false表示拒绝优化
    };

    const handleReset = () => {
        setStep('collecting');
        setError(null);
        setOriginalContent('');
        setOptimizedContent('');
        setOptimizationReport(null);
        handleCollectContent();
    };

    // 加载临时文件列表
    const loadTempFiles = async () => {
        if (!fileId) return;
        
        setTempFilesLoading(true);
        try {
            const result = await aiService.getTempFiles(fileId);
            if (result.success) {
                setTempFiles(result.files);
            }
        } catch (err) {
            console.error('加载临时文件失败:', err);
        }
        setTempFilesLoading(false);
    };

    // 处理选项卡切换
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        if (newValue === 1) {
            loadTempFiles(); // 切换到临时文件管理时加载列表
        }
    };

    // 清理临时文件
    const handleCleanupTempFiles = async () => {
        try {
            const result = await aiService.cleanupTempFiles(fileId);
            if (result.success) {
                loadTempFiles(); // 重新加载列表
            }
        } catch (err) {
            console.error('清理临时文件失败:', err);
        }
    };

    // 下载临时文件
    const handleDownloadTempFile = async (filename) => {
        try {
            const result = await aiService.getTempFileContent(filename);
            if (result.success) {
                // 创建下载链接
                const blob = new Blob([result.content], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error('下载临时文件失败:', err);
        }
    };

    const renderCollectingStep = () => (
        <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
                正在收集笔记内容...
            </Typography>
            <Typography variant="body2" color="text.secondary">
                正在读取文件 "{fileName}" 中的所有笔记内容
            </Typography>
        </Box>
    );

    const renderOptimizingStep = () => (
        <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
                AI正在优化内容...
            </Typography>
            <Typography variant="body2" color="text.secondary">
                AI正在分析和优化您的笔记内容，请稍候
            </Typography>
            {originalContent && (
                <Paper sx={{ mt: 3, p: 2, textAlign: 'left', maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        原始内容预览:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {originalContent.substring(0, 500)}
                        {originalContent.length > 500 && '...'}
                    </Typography>
                </Paper>
            )}
        </Box>
    );

    const renderResultStep = () => (
        <Box>
            {/* 优化报告 */}
            {optimizationReport && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        优化报告
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        <Chip 
                            size="small" 
                            label={`检测到 ${optimizationReport.changes_count} 处改进`}
                            color="primary"
                        />
                        <Chip 
                            size="small" 
                            label={`原始长度: ${optimizationReport.original_length}`}
                        />
                        <Chip 
                            size="small" 
                            label={`优化后长度: ${optimizationReport.optimized_length}`}
                        />
                    </Box>                    <Typography variant="body2">
                        改进项目: {optimizationReport.improvements && Array.isArray(optimizationReport.improvements) 
                            ? optimizationReport.improvements.join(', ') 
                            : '暂无改进项目'}
                    </Typography>
                </Alert>
            )}

            {/* 内容对比 */}
            <Box sx={{ display: 'flex', gap: 2, height: 400 }}>
                <Paper sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CompareIcon fontSize="small" />
                        原始内容
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {originalContent}
                    </Typography>
                </Paper>

                <Divider orientation="vertical" flexItem />

                <Paper sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: 'success.50' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AIIcon fontSize="small" />
                        AI优化后内容
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {optimizedContent}
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );

    // 渲染临时文件管理
    const renderTempFileManagement = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    <FolderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    临时文件管理
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCleanupTempFiles}
                    disabled={tempFilesLoading}
                    startIcon={<DeleteIcon />}
                >
                    清理临时文件
                </Button>
            </Box>

            {tempFilesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper variant="outlined">
                    {tempFiles.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                暂无临时文件
                            </Typography>
                        </Box>
                    ) : (
                        <List>
                            {tempFiles.map((file, index) => (
                                <React.Fragment key={file.filename}>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2">
                                                        {file.filename}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={file.type === 'optimized' ? '优化版本' : '收集版本'}
                                                        color={file.type === 'optimized' ? 'success' : 'default'}
                                                    />
                                                    {file.optimization_type && (
                                                        <Chip
                                                            size="small"
                                                            label={file.optimization_type}
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="caption" display="block">
                                                        大小: {(file.size / 1024).toFixed(1)} KB
                                                    </Typography>
                                                    <Typography variant="caption" display="block">
                                                        创建时间: {new Date(file.created_at).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Tooltip title="下载文件">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDownloadTempFile(file.filename)}
                                                >
                                                    <DownloadIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < tempFiles.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Paper>
            )}
        </Box>
    );

    return (
        <Dialog 
            open={open} 
            onClose={() => onClose(false)}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AIIcon />
                AI内容优化 - {fileName}
            </DialogTitle>            <DialogContent sx={{ minHeight: 500 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                    <Tab label="AI优化" />
                    <Tab label="临时文件管理" />
                </Tabs>

                {tabValue === 0 && (
                    <>
                        {step === 'collecting' && renderCollectingStep()}
                        {step === 'optimizing' && renderOptimizingStep()}
                        {step === 'result' && renderResultStep()}
                    </>
                )}

                {tabValue === 1 && renderTempFileManagement()}
            </DialogContent>

            <DialogActions>
                {step === 'result' && (
                    <>
                        <Button 
                            onClick={handleRejectOptimization}
                            startIcon={<RejectIcon />}
                            disabled={loading}
                        >
                            拒绝优化
                        </Button>
                        <Button 
                            onClick={handleReset}
                            disabled={loading}
                        >
                            重新优化
                        </Button>
                        <Button 
                            onClick={handleAcceptOptimization}
                            variant="contained"
                            startIcon={<AcceptIcon />}
                            disabled={loading}
                        >
                            {loading ? '应用中...' : '接受优化'}
                        </Button>
                    </>
                )}
                {step !== 'result' && (
                    <Button 
                        onClick={() => onClose(false)}
                        disabled={loading}
                    >
                        取消
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default AIOptimizeDialog;