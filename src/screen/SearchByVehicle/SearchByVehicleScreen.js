import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { showMessage } from 'react-native-flash-message';
import CustomTextInput from '../../component/CustomTextInput';
import { ProductListByVehicleURL } from '../../component/URL';
import { appColors } from '../../component/Color';
import CustomHeader from '../../component/CustomHeader';
import UnifiedPDFService from '../../component/UnifiedPDFService';
import UnifiedPDFButton from '../../component/UnifiedPDFButton';

const { width: screenWidth } = Dimensions.get('window');

class SearchByVehicleScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      input: '',
      loading: false,
      data: [],
      error: null,
      generatingPDF: false,
      pdfProgress: 0,
    };
  }

  fetchOEMData = async () => {
    const { input } = this.state;
    this.setState({ loading: true, error: null, data: [] });

    try {
      const formData = new FormData();
      formData.append('vehicle', input);

      const response = await axios.post(ProductListByVehicleURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.status && response.data.products) {
        this.setState({ data: response.data.products });
        console.log(`Loaded ${response.data.products.length} products`);
      } else {
        this.setState({ error: 'No products found.' });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      this.setState({ error: 'Failed to fetch data. Please try again.' });
    } finally {
      this.setState({ loading: false });
    }
  };

  // Create unified PDF using the service
  createUnifiedPDF = async () => {
    const { data, input } = this.state;

    if (!data || data.length === 0) {
      showMessage({
        message: 'No Data',
        description: 'No data available to generate PDF.',
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    this.setState({ generatingPDF: true, pdfProgress: 0 });

    try {
      const result = await UnifiedPDFService.createUnifiedPDF(
        data,
        'Vehicle Search Results',
        input,
        (progress) => this.setState({ pdfProgress: progress })
      );

      if (result) {
        console.log('PDF created successfully:', result);
      }
    } catch (error) {
      console.error('PDF creation error:', error);
    } finally {
      this.setState({ generatingPDF: false, pdfProgress: 0 });
    }
  };

  renderProductCard = ({ item, index }) => {
    const timestamp = Date.now();
    
    const imageUrl = item.image_path
      ? `https://mtechsolution.org/${item.image_path}?t=${timestamp}`
      : 'https://imgs.search.brave.com/K7TdjciLTAmvqtg6-fqKm20muPAAzRMj1OonJ6HIhME/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzg5LzU1LzE1/LzM2MF9GXzg5NTUx/NTk2X0xkSEFaUnd6/M2k0RU00SjBOSE5I/eTJoRVVZRGZYYzBq/LmpwZw';

    return (
      <TouchableOpacity style={styles.productCard} onPress={()=>{
        this.props.navigation.navigate('ProductDetail', {
          product: item,
          products: item.products,
          index,
        })
      }}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>UAW Serial No. :</Text>
            <Text style={styles.value}>{item.sr_no || '-'}</Text>
          </View>
         
          <View style={styles.detailRow}>
            <Text style={styles.label}>Vehicle :</Text>
            <Text style={styles.value}>{item.vehicle || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Description. :</Text>
            <Text style={styles.value}>{item.description || '-'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  render() {
    const { input, loading, data, error, generatingPDF, pdfProgress } = this.state;

    return (
      <View style={styles.container}>
        <CustomHeader title="Search by Vehicle" navigation={this.props.navigation} />

        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <CustomTextInput
              placeholder="Enter vehicle name"
              value={input}
              onChangeText={(text) => this.setState({ input: text })}
              style={styles.searchInput}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={this.fetchOEMData}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {data.length > 0 && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  Found {data.length} products
                </Text>
              </View>

              {/* Unified PDF Button */}
              <UnifiedPDFButton
                data={data}
                title="Generate PDF"
                searchQuery={input}
                onPress={this.createUnifiedPDF}
                generatingPDF={generatingPDF}
                pdfProgress={pdfProgress}
                disabled={data.length === 0}
              />

              <FlatList
                data={data}
                renderItem={this.renderProductCard}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
              />
            </View>
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.bgColor,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    backgroundColor: appColors.primary,
    height: 50,
    // paddingVertical: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: 'white',
    fontFamily: 'Exo2-Bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: appColors.red,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Exo2-SemiBold',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: 'Exo2-SemiBold',
    color: appColors.fontColor,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: appColors.cardBg,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: appColors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 15,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Exo2-Bold',
    color: appColors.gray,
    flex: 1,
  },
  value: {
    fontSize: 12,
    color: appColors.fontColor,
    flex: 2,
    textAlign: 'right',
    fontFamily: 'Exo2-Bold',
  },
});

export default SearchByVehicleScreen; 