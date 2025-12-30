import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { showMessage } from 'react-native-flash-message';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { appColors } from './Color';

class UnifiedPDFService {
    // Sanitize text for HTML to prevent XSS and formatting issues
    static sanitizeText(text, maxLength = 100) {
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
    }

    // Convert image to base64 for PDF inclusion
    static async convertImageToBase64(imagePath) {
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

    // Request storage permissions
    static async requestStoragePermission() {
        if (Platform.OS !== 'android') {
            return true;
        }

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'Storage Permission',
                    message: 'This app needs access to storage to save PDF files to Downloads folder.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn(err);
            return false;
        }
    }

    // Get Downloads directory path
    static async getDownloadsDirectory() {
        try {
            // Try multiple possible Downloads paths
            const possiblePaths = [
                RNFS.DownloadDirectoryPath,
                `${RNFS.ExternalDirectoryPath}/Download`,
                `${RNFS.ExternalDirectoryPath}/Downloads`,
                `${RNFS.DocumentDirectoryPath}/Downloads`,
            ];

            for (const path of possiblePaths) {
                try {
                    const exists = await RNFS.exists(path);
                    if (exists) {
                        return { path, exists: true };
                    }
                } catch (error) {
                    console.log(`Path ${path} not accessible:`, error);
                }
            }

            // If Downloads doesn't exist, try to create it
            const downloadsPath = RNFS.DownloadDirectoryPath;
            try {
                await RNFS.mkdir(downloadsPath);
                return { path: downloadsPath, exists: true };
            } catch (error) {
                console.log('Could not create Downloads directory:', error);
            }

            // Fallback to Documents directory
            return { path: RNFS.DocumentDirectoryPath, exists: true };
        } catch (error) {
            console.log('Error getting Downloads directory:', error);
            return { path: RNFS.DocumentDirectoryPath, exists: true };
        }
    }

    // Generate unified PDF content with images
    static async generateUnifiedPDFContent(data, title = 'Product Report', searchQuery = '') {
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
            console.log("ITEM",item)
            const rowStyle = i % 2 === 0 ? '' : alternateRowStyle;
            const sanitizedName = this.sanitizeText( item.sr_no || 'N/A', 100);
            const sanitizedDescription = this.sanitizeText(item.description || item.product_description || item.series_and_cross || 'N/A', 200);
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

    // Create unified PDF
    static async createUnifiedPDF(data, title = 'Product Report', searchQuery = '', onProgress) {
        if (!data || data.length === 0) {
            Alert.alert('No Data', 'No data available to generate PDF.');
            return null;
        }

        try {
            // Request permissions
            // const hasPermission = await this.requestStoragePermission();
            // if (!hasPermission) {
            //     Alert.alert(
            //         'Permission Denied',
            //         'Storage permission is required to save the PDF file to Downloads folder.'
            //     );
            //     return null;
            // }

            if (onProgress) onProgress(10);

            // Get Downloads directory
            const downloadsInfo = await this.getDownloadsDirectory();
            if (onProgress) onProgress(20);

            // Generate file name
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const fileName = `UAW_${title.replace(/\s+/g, '_')}_${timestamp}`;

            if (onProgress) onProgress(40);

            // Generate HTML content with images
            const htmlContent = await this.generateUnifiedPDFContent(data, title, searchQuery);
            if (onProgress) onProgress(60);

            // PDF options with proper settings for PDF generation
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

            if (onProgress) onProgress(80);

            // Generate PDF
            const result = await RNHTMLtoPDF.convert(pdfOptions);
            console.log('PDF creation result:', result);

            if (result.filePath) {
                if (onProgress) onProgress(90);

                // Copy to Downloads folder with .pdf extension
                const downloadPath = `${downloadsInfo.path}/${fileName}.pdf`;
                
                try {
                    await RNFS.copyFile(result.filePath, downloadPath);
                    await RNFS.unlink(result.filePath); // Clean up temp file

                    if (onProgress) onProgress(100);

                    // Show success message
                    showMessage({
                        message: '✅ PDF Downloaded Successfully!',
                        description: `PDF saved to Downloads folder`,
                        type: 'success',
                        duration: 4000,
                        backgroundColor: appColors.primary,
                        color: '#ffffff',
                    });

                    return downloadPath;
                } catch (copyError) {
                    console.error('Error copying PDF to Downloads:', copyError);
                    
                    // Try to open the PDF from temp location
                    try {
                        await FileViewer.open(result.filePath);
                        showMessage({
                            message: '✅ PDF Generated Successfully!',
                            description: 'PDF opened in viewer',
                            type: 'success',
                            duration: 4000,
                            backgroundColor: appColors.primary,
                            color: '#ffffff',
                        });
                        return result.filePath;
                    } catch (viewError) {
                        console.error('Error opening PDF:', viewError);
                        Alert.alert(
                            'PDF Generated',
                            'PDF was generated but could not be saved to Downloads folder. Please check your storage permissions.',
                            [
                                { text: 'OK', onPress: () => {} }
                            ]
                        );
                        return result.filePath;
                    }
                }
            } else {
                throw new Error('PDF generation failed');
            }
        } catch (error) {
            console.error('PDF generation error:', error);
            
            showMessage({
                message: '❌ PDF Generation Failed',
                description: error.message || 'Failed to generate PDF. Please try again.',
                type: 'danger',
                duration: 4000,
                backgroundColor: '#dc3545',
                color: '#ffffff',
            });
            
            Alert.alert(
                'PDF Generation Failed',
                error.message || 'Failed to generate PDF. Please try again.',
                [
                    { text: 'OK', onPress: () => {} }
                ]
            );
            
            return null;
        }
    }
}

export default UnifiedPDFService; 