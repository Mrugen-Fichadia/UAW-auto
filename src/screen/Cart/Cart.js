import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { appColors } from '../../component/Color';

class Cart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cartItems: [],
      userData: null,
    };
  }

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener('focus', () => {
      this.fetchCart();
      this.getUserData();
    });
  }

  componentWillUnmount() {
    if (this.focusListener) {
      this.focusListener();
    }
  }

  fetchCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem('cart');
      const parsedCart = storedCart ? JSON.parse(storedCart) : [];
      console.log("parsedCart",parsedCart)
      this.setState({ cartItems: parsedCart });
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  getUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        this.setState({ userData: parsedData });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  handleDelete = async itemToDelete => {
    try {
      const updatedCart = this.state.cartItems.filter(
        item => item.id !== itemToDelete.id,
      );
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
      this.setState({ cartItems: updatedCart });
      Alert.alert(
        'Success',
        `${itemToDelete.name} has been removed from the cart!`,
      );
    } catch (error) {
      console.error('Error deleting item from cart:', error);
      Alert.alert('Error', 'Unable to delete the item. Please try again.');
    }
  };

  clearCart = async () => {
    try {
      await AsyncStorage.removeItem('cart');
      this.setState({ cartItems: [] });
      Alert.alert('Success', 'Cart has been cleared!');
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Error', 'Unable to clear the cart. Please try again.');
    }
  };

  handleOrder = () => {
    const { cartItems } = this.state;
    this.props.navigation.navigate('Checkout', { cartItems });
  };

  renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.image_path
              ? `https://mtechsolution.org/${item.image_path}?t=${Date.now()}`
              : 'https://imgs.search.brave.com/K7TdjciLTAmvqtg6-fqKm20muPAAzRMj1OonJ6HIhME/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzAwLzg5LzU1LzE1/LzM2MF9GXzg5NTUx/NTk2X0xkSEFaUnd6/M2k0RU00SjBOSE5I/eTJoRVVZRGZYYzBq/LmpwZw',
          }}
          style={styles.productImage}
        />
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.detailText} numberOfLines={3}>
          <Text style={styles.label}>Product Name:</Text> {item?.name}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.label}>Series and Cross:</Text>{' '}
          {item?.series_and_cross}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.label}>Length:</Text> {item?.length_inch}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.label}>Quantity:</Text> {item.quantity}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => this.handleDelete(item)}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  render() {
    const { cartItems, userData } = this.state;
    return (
      <View style={styles.container}>


        <FlatList
          data={cartItems}
          keyExtractor={item => item.id.toString()}
          renderItem={this.renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Cart is empty</Text>
          }
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.clearCartButton}
            onPress={this.clearCart}>
            <Text style={styles.clearCartButtonText}>Clear Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => {
              if (userData) {
                this.handleOrder(); // ✅ Navigates to Checkout
              } else {
                Alert.alert(
                  'Login Required',
                  'Please login to place an order.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'OK',
                      onPress: () => this.props.navigation.navigate('Login'),
                    },
                  ],
                  { cancelable: true },
                );
              }
            }}>
            <Text style={styles.orderButtonText}>Order</Text>
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
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFD580',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'black',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 10,
  },
  detailText: {
    fontSize: 14,
    color: 'black',
    marginBottom: 5,
    fontFamily: 'Exo2-Regular',
  },
  label: {
    fontFamily: 'Exo2-Bold',
    color: 'black',
  },
  deleteButton: {
    backgroundColor: appColors.red,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Exo2-Bold',
  },
  emptyText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginTop: 50,
    fontFamily: 'Exo2-SemiBold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 80,
  },
  clearCartButton: {
    backgroundColor: 'black',
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  clearCartButtonText: {
    color: '#FFD580',
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
  },
  orderButton: {
    backgroundColor: 'black',
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  orderButtonText: {
    color: '#FFD580',
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
  },
  headerContainer: {
    height: 60,
    backgroundColor: '#FFD580',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Exo2-SemiBold',
    marginLeft: 10,
    color: 'black',
  },
});

export default Cart