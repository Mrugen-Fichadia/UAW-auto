import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import CustomTextInput from '../../component/CustomTextInput';
import { appColors } from '../../component/Color';
import CustomHeader from '../../component/CustomHeader';
import { ProductListURL } from '../../component/URL';

export default class SearchByCategoryScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      input: '',
      loading: false,
      products: [],
      filteredData: [],
      detailedProduct: null,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchProductData();
  }

  fetchProductData = async (productId = '') => {
    this.setState({
      loading: true,
      error: null,
      products: [],
      detailedProduct: null,
    });

    try {
      const formData = new FormData();
      formData.append('product_id', productId);

      const response = await axios.post(
        ProductListURL,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.status) {
        if (productId) {
          this.setState({ detailedProduct: response.data.response });
        } else {
          this.setState({
            products: response.data.response.products,
            filteredData: response.data.response.products,
          });
        }
      } else {
        this.setState({ error: response.data.message || 'No products found.' });
      }
    } catch (err) {
      console.error('API Error:', err.message);
      this.setState({ error: 'Failed to fetch data. Please try again.' });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleSearch = (text) => {
    const { products } = this.state;
    const filtered = products.filter((item) =>
      item.name.toLowerCase().includes(text.toLowerCase())
    );
    this.setState({
      input: text,
      filteredData: text ? filtered : products,
    });
  };

  renderProductItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          this.props.navigation.navigate('ProductList', {
            productId: item.id,
          })
        }>
        <Text style={styles.itemText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  renderDetailedProduct = () => {
    const { detailedProduct } = this.state;
    const timestamp = Date.now();
    if (!detailedProduct) return null;

    const product = detailedProduct.product;
    const imageUrl = product.image_path
      ? `https://mtechsolution.org/${product.image_path}?t=${timestamp}`
      : 'https://via.placeholder.com/150';

    return (
      <View style={styles.detailContainer}>
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
        <Text style={styles.detailText}>Name: {product.name}</Text>
        <Text style={styles.detailText}>Price: ₹{product.price}</Text>
        <Text style={styles.detailText}>Description: {product.description}</Text>
        <Text style={styles.detailText}>Vehicle: {detailedProduct.vehicle}</Text>
        <Text style={styles.detailText}>OEM: {detailedProduct.oem}</Text>
        <Text style={styles.detailText}>
          Series and Cross: {detailedProduct.series_and_cross.join(', ')}
        </Text>
        <Text style={styles.detailText}>
          Number of Teeth: {detailedProduct.no_of_teeth.join(', ')}
        </Text>
        <Text style={styles.detailText}>
          Total Length (Inch): {detailedProduct.total_length_inch.join(', ')}
        </Text>
        <Text style={styles.detailText}>
          Total Length (MM): {detailedProduct.total_length_mm.join(', ')}
        </Text>
      </View>
    );
  };

  render() {
    const { input, loading, filteredData, error, detailedProduct } = this.state;

    return (
      <View style={styles.container}>
        <CustomHeader title={'Search By Category'} navigation={this.props.navigation} />
        <View style={styles.innerContainer}>
          <Text style={styles.label}>Enter Category Name</Text>

          <CustomTextInput
            placeholder="Type here..."
            value={input}
            onChangeText={this.handleSearch}
            leftIcon="search"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          {loading ? (
            <ActivityIndicator size="large" color={appColors.primary} />
          ) : detailedProduct ? (
            this.renderDetailedProduct()
          ) : (
            <FlatList
              data={filteredData}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={this.renderProductItem}
              ListEmptyComponent={
                !loading && <Text style={styles.noData}>No products found.</Text>
              }
            />
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
  innerContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: appColors.fontColor,
    fontFamily: "Exo2-Regular",
    marginBottom: 5,
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    alignSelf: 'stretch',

  },
  itemText: {
    fontSize: 14,
    color: appColors.fontColor,
    fontFamily: 'Exo2-Regular'
  },
  itemImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  detailContainer: {
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  noData: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});
