import React, { Component } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { ProductListURL } from '../../component/URL';
import { appColors } from '../../component/Color';
import CustomHeader from '../../component/CustomHeader';
import { showMessage } from 'react-native-flash-message';
import UnifiedPDFService from '../../component/UnifiedPDFService';
import UnifiedPDFButton from '../../component/UnifiedPDFButton';

export default class ProductList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      products: [],
      generatingPDF: false,
      pdfProgress: 0,
    };
  }

  componentDidMount() {
    this.fetchProducts();
  }

  fetchProducts = async () => {
    const { productId } = this.props.route.params;
    this.setState({ loading: true });

    try {
      const formData = new FormData();
      formData.append('product_id', productId);

      const response = await axios.post(ProductListURL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const productData = response.data?.response?.product;

      if (Array.isArray(productData)) {
        this.setState({ products: productData });
      } else {
        showMessage({
          message: 'No Products Found',
          description: 'No data available for the selected product.',
          type: 'warning',
          icon: 'auto',
        });
        this.setState({ products: [] });
      }
    } catch (error) {
      console.error('API Error:', error.message);
      showMessage({
        message: 'Error',
        description: 'Failed to fetch products. Please try again later.',
        type: 'danger',
        icon: 'auto',
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  createUnifiedPDF = async () => {
    const { products } = this.state;
    if (!products || products.length === 0) {
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
        products,
        'Search By Category',
        '',
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

  renderProductCard = ({ item }) => {
    const { navigation } = this.props;
    const { products } = this.state;
    console.log("item", item);
    const timestamp = Date.now();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ProductDetail', {
            product: item,
            products: products,
            index: products.findIndex((p) => p.id === item.id),
          })
        }
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.image_path
                ? `https://mtechsolution.org/${item.image_path}?t=${timestamp}`
                : 'https://imgs.search.brave.com/K7TdjciLTAmvqtg6-fqKm20muPAAzRMj1OonJ6HIhME/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzg5LzU1LzE1/LzM2MF9GXzg5NTUx/NTk2X0xkSEFaUnd6/M2k0RU00SjBOSE5I/eTJoRVVZRGZYYzBq/LmpwZw',
            }}
            style={styles.image}
          />
        </View>
        <View style={styles.detailsContainer}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.title}>UAW Serial No. : </Text>
            <Text style={styles.value}>{item.sr_no}</Text>
          </View>          
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.title}>Vehicle : </Text>
            <Text style={styles.value}>{item.vehicle}</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.title}>Description : </Text>
            <Text numberOfLines={4} style={styles.value}>{item.description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  render() {
    const { loading, products, generatingPDF, pdfProgress } = this.state;

    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={appColors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CustomHeader
          title={'Product List'}
          navigation={this.props.navigation}
        />
        <View style={styles.innerContainer}>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            renderItem={this.renderProductCard}
            ListEmptyComponent={
              !loading && (
                <Text style={styles.noData}>
                  No products found. Try a different product ID.
                </Text>
              )
            }
            contentContainerStyle={{ paddingBottom: 100 }} // avoid overlap with button
          />
        </View>

        {/* Save PDF button fixed near bottom */}
        {products.length > 0 && (
          <UnifiedPDFButton
            data={products}
            title="Generate PDF"
            searchQuery={''}
            onPress={this.createUnifiedPDF}
            generatingPDF={generatingPDF}
            pdfProgress={pdfProgress}
            disabled={products.length === 0}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: appColors.bgColor,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noData: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: appColors.fontColor,
    fontFamily: 'Exo2-SemiBold',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFD580',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  detailsContainer: {},
  title: {
    fontSize: 14,
    color: 'black',
    fontFamily: 'Exo2-SemiBold',
  },
  value: {
    fontSize: 14,
    fontFamily: 'Exo2-Regular',
    color: 'black',
    marginBottom: 8,
    width:"50%",
    
  },
});
