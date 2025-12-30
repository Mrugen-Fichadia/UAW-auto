import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { showMessage } from 'react-native-flash-message';
import { appColors } from './Color';

class UnifiedPDFGenerator extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            generatingPDF: false,
            pdfProgress: 0,
        };
    }

    // Request storage permissions
    requestStoragePermission = async () => {
        if (Platform.OS !== 'android') {
            return true;
        }

        try {
            const apiLevel = Platform.Version;
            
            if (apiLevel >= 30) {
                // Android 11+ (API 30+) - Use MANAGE_EXTERNAL_STORAGE
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission',
                        message: 'This app needs access to storage to save PDF files to Downloads folder',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                // Android 10 and below - Use WRITE_EXTERNAL_STORAGE
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission',
                        message: 'This app needs access to storage to save PDF files to Downloads folder',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        } catch (err) {
            console.error('Permission request error:', err);
            return false;
        }
    };

    // Get the best available Downloads directory
    getDownloadsDirectory = async () => {
        try {
            // Try different possible Downloads paths
            const possiblePaths = [
                RNFS.DownloadDirectoryPath,
                `${RNFS.ExternalDirectoryPath}/Download`,
                `${RNFS.ExternalDirectoryPath}/Downloads`,
                `${RNFS.ExternalCachesDirectoryPath}/Download`,
                RNFS.DocumentDirectoryPath, // Fallback
            ];

            for (const path of possiblePaths) {
                try {
                    const exists = await RNFS.exists(path);
                    if (exists) {
                        console.log('Found Downloads directory:', path);
                        return {
                            path,
                            displayName: path.includes('Download') ? 'Downloads' : 'Documents'
                        };
                    }
                } catch (error) {
                    console.log('Path not accessible:', path, error.message);
                }
            }

            // If no Downloads directory found, create one
            const downloadPath = `${RNFS.ExternalDirectoryPath}/Download`;
            try {
                await RNFS.mkdir(downloadPath);
                console.log('Created Downloads directory:', downloadPath);
                return {
                    path: downloadPath,
                    displayName: 'Downloads'
                };
            } catch (error) {
                console.log('Could not create Downloads directory, using Documents');
                return {
                    path: RNFS.DocumentDirectoryPath,
                    displayName: 'Documents'
                };
            }
        } catch (error) {
            console.error('Downloads directory error:', error);
            return {
                path: RNFS.DocumentDirectoryPath,
                displayName: 'Documents'
            };
        }
    };

    // Generate unified PDF content with images
    generateUnifiedPDFContent = async (data, title = 'Product Report', searchQuery = '') => {
        const sanitizedTitle = this.sanitizeText(title, 50);
        const sanitizedQuery = this.sanitizeText(searchQuery, 100);
        
        const headerStyle = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 20px;
        `;
        
        const tableStyle = `
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-family: Arial, sans-serif;
            font-size: 12px;
        `;
        
        const thStyle = `
            background-color: #f8f9fa;
            color: #495057;
            padding: 12px;
            text-align: left;
            border: 1px solid #dee2e6;
            font-weight: bold;
            font-size: 12px;
        `;
        
        const tdStyle = `
            padding: 10px;
            border: 1px solid #dee2e6;
            vertical-align: top;
            font-size: 11px;
        `;
        
        const imageStyle = `
            max-width: 80px;
            max-height: 80px;
            object-fit: contain;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        `;
        
        const alternateRowStyle = `
            background-color: #f8f9fa;
        `;

        let tableRows = '';
        const timestamp = Date.now();
        
        // Process data and convert images to base64
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const rowStyle = i % 2 === 0 ? '' : alternateRowStyle;
            const sanitizedName = this.sanitizeText(item.sr_no|| 'N/A', 100);
            const sanitizedDescription = this.sanitizeText(item.description|| 'N/A', 200);
            const sanitizedPrice = this.sanitizeText(item.price || item.product_price || 'N/A', 50);
            const sanitizedCategory = this.sanitizeText(item.category || item.product_category || item.vehicle || 'N/A', 50);
            
            
            // Convert image to base64 if available
            let imageHtml = '';
            if (item.image || item.product_image || item.image_url || item.image_path) {
                let imagePath = item.image || item.product_image || item.image_url || item.image_path;
                
                // If it's image_path, construct the full URL
                if (item.image_path && !imagePath.startsWith('http')) {
                    imagePath = `https://mtechsolution.org/${item.image_path}?t=${timestamp}`;
                }
                
                const base64Image = await this.convertImageToBase64(imagePath);
                if (base64Image) {
                    imageHtml = `<img src="${base64Image}" style="${imageStyle}" alt="Product Image" />`;
                }
            }
            
            tableRows += `
                <tr style="${rowStyle}">
                    <td style="${tdStyle}">
                        ${imageHtml}
                        <div style="margin-top: 5px;">${sanitizedName}</div>
                    </td>
                    <td style="${tdStyle}">${sanitizedDescription}</td>
                    <td style="${tdStyle}">${sanitizedPrice}</td>
                    <td style="${tdStyle}">${sanitizedCategory}</td>
                </tr>
            `;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${sanitizedTitle}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: #ffffff;
                        color: #333333;
                        line-height: 1.4;
                    }
                    
                    .header {
                        ${headerStyle}
                    }
                    
                    .header h1 {
                        margin: 0 0 10px 0;
                        font-size: 24px;
                        font-weight: bold;
                    }
                    
                    .header p {
                        margin: 0;
                        font-size: 14px;
                        opacity: 0.9;
                    }
                    
                    .search-info {
                        background-color: #e9ecef;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        border-left: 4px solid #007bff;
                    }
                    
                    .search-info strong {
                        color: #007bff;
                    }
                    
                    table {
                        ${tableStyle}
                        page-break-inside: auto;
                    }
                    
                    thead {
                        display: table-header-group;
                    }
                    
                    tbody {
                        display: table-row-group;
                    }
                    
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    
                    th {
                        ${thStyle}
                    }
                    
                    td {
                        ${tdStyle}
                    }
                    
                    .footer {
                        margin-top: 30px;
                        padding: 15px;
                        background-color: #f8f9fa;
                        border-radius: 5px;
                        text-align: center;
                        color: #6c757d;
                        font-size: 12px;
                        border-top: 2px solid #dee2e6;
                    }
                    
                    .footer p {
                        margin: 5px 0;
                    }
                    
                    @media print {
                        body {
                            margin: 0;
                            padding: 10px;
                        }
                        
                        .header {
                            margin-bottom: 15px;
                        }
                        
                        .search-info {
                            margin-bottom: 15px;
                        }
                        
                        table {
                            font-size: 10px;
                        }
                        
                        th, td {
                            padding: 8px;
                            font-size: 10px;
                        }
                        
                        img {
                            max-width: 60px;
                            max-height: 60px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${sanitizedTitle}</h1>
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
                
                ${sanitizedQuery ? `
                    <div class="search-info">
                        <strong>Search Query:</strong> ${sanitizedQuery}
                    </div>
                ` : ''}
                
                <table>
                    <thead>
                        <tr>
                            <th>Image & Name/Serial No</th>
                            <th>Description/Series</th>
                            <th>Price/OEM</th>
                            <th>Category/Vehicle</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p><strong>Total Items:</strong> ${data.length}</p>
                    <p><strong>Generated by:</strong> UAW Auto App</p>
                    <p><strong>Report Type:</strong> Product Report</p>
                </div>
            </body>
            </html>
        `;

        return htmlContent;
    }

    // Sanitize text for HTML
    sanitizeText = (text, maxLength = 100) => {
        if (!text) return '-';
        return text
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .trim()
            .substring(0, maxLength);
    };

    // Convert image to base64 for PDF inclusion
    convertImageToBase64 = async (imagePath) => {
        try {
            if (!imagePath) return null;
            
            // Check if it's already a base64 string
            if (imagePath.startsWith('data:image/')) {
                return imagePath;
            }
            
            // Check if it's a local file path
            if (imagePath.startsWith('file://') || imagePath.startsWith('/')) {
                const exists = await RNFS.exists(imagePath);
                if (exists) {
                    const base64 = await RNFS.readFile(imagePath, 'base64');
                    // Determine MIME type based on file extension
                    const extension = imagePath.split('.').pop().toLowerCase();
                    const mimeType = {
                        'jpg': 'image/jpeg',
                        'jpeg': 'image/jpeg',
                        'png': 'image/png',
                        'gif': 'image/gif',
                        'webp': 'image/webp'
                    }[extension] || 'image/jpeg';
                    
                    return `data:${mimeType};base64,${base64}`;
                }
            }
            
            // If it's a network URL, download it first
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                try {
                    // Download the image to a temporary file
                    const tempPath = `${RNFS.CachesDirectoryPath}/temp_image_${Date.now()}.jpg`;
                    const response = await RNFS.downloadFile({
                        fromUrl: imagePath,
                        toFile: tempPath,
                        background: false,
                        discretionary: false,
                        progress: () => {},
                    }).promise;
                    
                    if (response.statusCode === 200) {
                        // Read the downloaded file as base64
                        const base64 = await RNFS.readFile(tempPath, 'base64');
                        // Clean up the temporary file
                        await RNFS.unlink(tempPath);
                        
                        // Determine MIME type from URL or default to JPEG
                        const url = imagePath.toLowerCase();
                        let mimeType = 'image/jpeg';
                        if (url.includes('.png')) mimeType = 'image/png';
                        else if (url.includes('.gif')) mimeType = 'image/gif';
                        else if (url.includes('.webp')) mimeType = 'image/webp';
                        
                        return `data:${mimeType};base64,${base64}`;
                    }
                } catch (downloadError) {
                    console.log('Error downloading image:', downloadError);
                    return null;
                }
            }
            
            return null;
        } catch (error) {
            console.log('Error converting image to base64:', error);
            return null;
        }
    }

    // Create unified PDF
    createUnifiedPDF = async () => {
        const { data, title = 'Product Report', searchQuery = '' } = this.props;

        if (!data || data.length === 0) {
            Alert.alert('No Data', 'No data available to generate PDF.');
            return;
        }

        try {
            // Request permissions
            const hasPermission = await this.requestStoragePermission();
            if (!hasPermission) {
                Alert.alert(
                    'Permission Denied',
                    'Storage permission is required to save the PDF file to Downloads folder.'
                );
                return;
            }

            this.setState({ generatingPDF: true, pdfProgress: 10 });

            // Get Downloads directory
            const downloadsInfo = await this.getDownloadsDirectory();
            this.setState({ pdfProgress: 20 });

            // Generate file name
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const fileName = `UAW_${title.replace(/\s+/g, '_')}_${timestamp}`;

            this.setState({ pdfProgress: 40 });

            // Generate HTML content
            const htmlContent = await this.generateUnifiedPDFContent(data, title, searchQuery);
            this.setState({ pdfProgress: 60 });

            // PDF options
            const pdfOptions = {
                html: htmlContent,
                fileName: fileName,
                directory: 'Documents', // Temporary directory for PDF generation
                base64: false,
                height: 842, // A4 height in points
                width: 595,  // A4 width in points
                padding: 20,
                // Additional options to ensure proper PDF generation
                format: 'A4',
                quality: 'high',
                margin: 10,
            };

            this.setState({ pdfProgress: 80 });

            // Generate PDF
            const result = await RNHTMLtoPDF.convert(pdfOptions);
            console.log('PDF creation result:', result);

            if (result.filePath) {
                this.setState({ pdfProgress: 90 });

                // Copy to Downloads folder
                const downloadPath = `${downloadsInfo.path}/${fileName}.pdf`;
                
                try {
                    await RNFS.copyFile(result.filePath, downloadPath);
                    await RNFS.unlink(result.filePath); // Clean up temp file

                    this.setState({ pdfProgress: 100 });

                    // Show success message
                    showMessage({
                        message: '✅ PDF Downloaded Successfully!',
                        description: `PDF saved to ${downloadsInfo.displayName} folder`,
                        type: 'success',
                        duration: 4000,
                    });

                    // Try to open the PDF
                    try {
                        await FileViewer.open(downloadPath, {
                            showOpenWithDialog: true,
                            onDismiss: () => console.log('File viewer dismissed'),
                        });
                    } catch (error) {
                        console.log('Could not open PDF with FileViewer, trying share...');
                        // Fallback to share
                        const Share = require('react-native').Share;
                        await Share.share({
                            url: `file://${downloadPath}`,
                            title: `${title}.pdf`,
                            message: `UAW Auto - ${title}`,
                        });
                    }
                } catch (copyError) {
                    console.error('Error copying to Downloads:', copyError);
                    
                    // Fallback: keep the file in Documents folder
                    const documentsPath = result.filePath;
                    
                    showMessage({
                        message: '⚠️ PDF Saved to Documents',
                        description: 'Could not save to Downloads, saved to Documents folder instead',
                        type: 'warning',
                        duration: 4000,
                    });
                }
            } else {
                throw new Error('PDF generation failed');
            }
        } catch (error) {
            console.error('PDF Creation Error:', error);
            Alert.alert(
                'PDF Generation Failed',
                error.message || 'Failed to create PDF. Please try again.',
                [
                    { text: 'OK' },
                    { text: 'Try Again', onPress: () => this.createUnifiedPDF() }
                ]
            );
        } finally {
            this.setState({ generatingPDF: false, pdfProgress: 0 });
        }
    };

    render() {
        const { generatingPDF, pdfProgress } = this.state;
        const { style, title = 'Download PDF' } = this.props;

        return (
            <TouchableOpacity
                style={[styles.button, style]}
                onPress={this.createUnifiedPDF}
                disabled={generatingPDF}
            >
                {generatingPDF ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.loadingText}>
                            Generating PDF... {pdfProgress}%
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.buttonText}>{title}</Text>
                )}
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: appColors.primary || '#ffa600',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#ffffff',
        fontSize: 14,
        marginLeft: 8,
    },
});

export default UnifiedPDFGenerator; 