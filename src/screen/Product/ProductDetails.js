import React, { Component } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import CustomHeader from '../../component/CustomHeader';
import { appColors } from '../../component/Color';
import { showMessage } from 'react-native-flash-message';

export default class ProductDetail extends Component {
  constructor(props) {
    super(props);
    const { product, products, index } = props.route.params;
    const timestamp = Date.now();

    this.state = {
      currentProduct: product,
      products,
      currentIndex: index,
      quantity: '1',
      quantityError: false,
      cartItems: 0,
      mainImage: { uri: `https://mtechsolution.org/${product.image_path}?t=${timestamp}` },
    };

    this.currentIndexRef = index;

    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 20,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50) this.goToNextProduct();
        else if (gestureState.dx > 50) this.goToPrevProduct();
      },
    });
  }

  componentDidMount() {
    this.fetchCart();
    this.focusListener = this.props.navigation.addListener('focus', this.fetchCart);
  }

  componentWillUnmount() {
    this.focusListener?.();
  }

  fetchCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem('cart');
      const parsedCart = storedCart ? JSON.parse(storedCart) : [];
      this.setState({ cartItems: parsedCart.length });
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  incrementQuantity = () => {
    const num = this.state.quantity === '' ? 0 : parseInt(this.state.quantity, 10);
    this.setState({ quantity: (num + 1).toString(), quantityError: false });
  };

  decrementQuantity = () => {
    const num = this.state.quantity === '' ? 1 : parseInt(this.state.quantity, 10);
    if (num > 1) {
      this.setState({ quantity: (num - 1).toString(), quantityError: false });
    }
  };

  handleQuantityChange = (text) => {
    if (text === '' || /^\d*$/.test(text)) {
      this.setState({ quantity: text, quantityError: false });
    }
  };

  validateQuantity = () => {
    const { quantity } = this.state;
    if (quantity === '' || parseInt(quantity, 10) < 1) {
      this.setState({ quantity: '1' });
    }
  };

  addToCart = async () => {
    const { currentProduct, quantity } = this.state;
    const qty = quantity === '' ? 0 : parseInt(quantity, 10);

    if (qty < 1) {
      this.setState({ quantityError: true });
      Alert.alert('Error', 'Please enter a valid quantity (minimum 1)');
      return;
    }

    try {
      const currentCart = await AsyncStorage.getItem('cart');
      const parsedCart = currentCart ? JSON.parse(currentCart) : [];
      const newCart = [...parsedCart, { ...currentProduct, quantity: qty }];
      await AsyncStorage.setItem('cart', JSON.stringify(newCart));
    //   Alert.alert('Success', `${qty} Quantity of ${currentProduct.name} added to cart!`);
      showMessage({
        message: `${qty} Quantity of ${currentProduct.name} added to cart!`,
        type: 'success',
        duration: 2000,
      })
      this.setState({ quantity: '1' });
      this.fetchCart();
    } catch (error) {
      console.error('Error saving to cart:', error);
    }
  };

  goToNextProduct = () => {
    const { products } = this.state;
    const timestamp = Date.now();
    if (this.currentIndexRef < products.length - 1) {
      const nextIndex = this.currentIndexRef + 1;
      const nextProduct = products[nextIndex];
      this.setState({
        currentIndex: nextIndex,
        currentProduct: nextProduct,
        mainImage: { uri: `https://mtechsolution.org/${nextProduct.image_path}?t=${timestamp}` },
      });
      this.currentIndexRef = nextIndex;
    }
  };

  goToPrevProduct = () => {
    const timestamp = Date.now();
    if (this.currentIndexRef > 0) {
      const prevIndex = this.currentIndexRef - 1;
      const prevProduct = this.state.products[prevIndex];
      this.setState({
        currentIndex: prevIndex,
        currentProduct: prevProduct,
        mainImage: { uri: `https://mtechsolution.org/${prevProduct.image_path}?t=${timestamp}` },
      });
      this.currentIndexRef = prevIndex;
    }
  };

  renderDetailRow = (label, value) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  render() {
    const timestamp = Date.now();
    const { currentProduct, quantity, quantityError, cartItems, mainImage } = this.state;
    const images = [{ uri: `https://mtechsolution.org/${currentProduct.image_path}?t=${timestamp}` }];

    return (
      <View style={styles.container} {...this.panResponder.panHandlers}>
        <CustomHeader
          title="Product Description"
          navigation={this.props.navigation}
          rightIcon="cart"
          rightIconPress={() => this.props.navigation.navigate('Cart')}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{currentProduct.name}</Text>
            <Text style={[styles.stockBadge, !currentProduct.in_stock && styles.outOfStockBadge]}>
              {currentProduct.in_stock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          <ReactNativeZoomableView
            maxZoom={2}
            minZoom={1}
            zoomStep={0.5}
            initialZoom={1}
            bindToBorders={true}
            style={{ width: '100%', height: 250 }}
            contentWidth={300}
            contentHeight={250}
          >
            <Image source={mainImage} style={{ width: '100%', height: 250, resizeMode: 'contain' }} />
          </ReactNativeZoomableView>

          <View style={styles.imageGallery}>
            {images.map((image, index) => (
              <TouchableOpacity key={index} onPress={() => this.setState({ mainImage: image })} style={styles.thumbnailWrapper}>
                <Image source={image} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.detailsContainer}>
            {this.renderDetailRow('Serial No', currentProduct?.sr_no)}
            {this.renderDetailRow('Description', currentProduct?.description)}
            {this.renderDetailRow('Price', `₹${currentProduct?.price}`)}
            {this.renderDetailRow('OEM', currentProduct?.oem)}
            {this.renderDetailRow('Stock Quantity', currentProduct?.qty?.toString())}
            {this.renderDetailRow('Vehicle', currentProduct?.vehicle)}
            {this.renderDetailRow('Length (Inch)', currentProduct?.length_inch)}
            {this.renderDetailRow('Length (MM)', currentProduct?.length_mm)}
            {this.renderDetailRow('Pipe Diameter (Inch)', currentProduct?.pipe_dia_inch)}
            {this.renderDetailRow('Pipe Diameter (MM)', currentProduct?.pipe_dia_mm)}
            {this.renderDetailRow('Series and Cross', currentProduct?.series_and_cross)}
          </View>
        </ScrollView>

        <View style={styles.actionsContainer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityButton} onPress={this.decrementQuantity}>
              <Icon name="remove" size={24} color={appColors.white} />
            </TouchableOpacity>
            <TextInput
              style={[styles.quantityInput, quantityError && styles.errorInput]}
              keyboardType="numeric"
              value={quantity}
              onChangeText={this.handleQuantityChange}
              onBlur={this.validateQuantity}
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.quantityButton} onPress={this.incrementQuantity}>
              <Icon name="add" size={24} color={appColors.white} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cartIcon} onPress={this.addToCart}>
            <Text style={styles.cartText}>Add To Cart</Text>
            <Icon name="shopping-cart" size={24} color={appColors.white} />
          </TouchableOpacity>
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
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: appColors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerContainer: {
    height: 60,

    justifyContent: 'space-between',
    backgroundColor: '#FFD580',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: -20,
    elevation: 4, // Adds shadow for Android
    shadowColor: '#000', // Adds shadow for iOS
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal:10
  },
  title: {
    fontSize: 24,
    fontFamily: 'Exo2-Bold',
    color: appColors.fontColor,
    flex: 1,
  },
  stockBadge: {
    fontSize: 14,
    fontFamily: 'Exo2-Bold',
    color: appColors.white,
    backgroundColor: appColors.fireColor,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  outOfStockBadge: {
    backgroundColor: '#FF5252',
  },
  productImage: {
    width: '100%',
    height: 250,
    // borderRadius: 10,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  imageGallery: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
    paddingHorizontal:10
  },
  thumbnailWrapper: {
    marginRight: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDD',
    resizeMode: 'cover',
  },
  detailsContainer: {
    backgroundColor: appColors.white,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Exo2-Bold',
    color: 'black',
  },
  detailValue: {
    fontSize: 14,
    color: appColors.primary,
    flex: 1,
    fontFamily:"Exo2-SemiBold",
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
    borderTopWidth: 0.5,
    borderColor: appColors.primary,
    backgroundColor: '#FFD580',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColors.white,
    borderRadius: 5,
    backgroundColor:appColors.primary,
    marginHorizontal: 10,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 50,
    height: 40,
    textAlign: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor:appColors.white,
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
    marginHorizontal: 10,
    alignSelf:'center',
    color:appColors.white
  },
  cartIcon: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: appColors.white,
  },
  cartText: {
    padding: 10,
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
    color: appColors.white,
  },
  errorInput: {
    borderColor: 'red',
    backgroundColor: '#FFEEEE',
  },
});
