import React, { Component } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import ImageSelector from '../../component/ImageSelector';
import Icon from 'react-native-vector-icons/Ionicons';
import { appColors } from '../../component/Color';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedImage: null,
      name: '',
      number: '',
    };
  }

  async componentDidMount() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = userData ? JSON.parse(userData) : null;

      if (parsedUser) {
        this.setState({
          name: parsedUser.name || '',
          number: parsedUser.phone || '',
        });
      }
    } catch (error) {
      console.log('Error retrieving user data:', error);
    }
  }

  handleImageSelect = (imageUris) => {
    if (imageUris && imageUris.length > 0) {
      this.setState({ selectedImage: imageUris[0] });
    }
  };

  handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              this.props.navigation.replace('Login');
            } catch (error) {
              console.log('Error clearing AsyncStorage:', error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  render() {
    const { selectedImage, name, number } = this.state;

    return (
      <View style={styles.container}>
        {/* Profile Image */}
        <TouchableOpacity
          onPress={() => this.imageSelectorRef?.show()}
          style={styles.imageContainer}
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.dummyIcon}>
              <Icon name="person-circle-outline" size={120} color="#888" />
            </View>
          )}
        </TouchableOpacity>

        {/* Username & Mobile (dynamic) */}
        <Text style={styles.username}>{name || 'Guest User'}</Text>
        <Text style={styles.mobile}>{number || '+91 -----------'}</Text>

        {/* Reward Claims */}
        <TouchableOpacity
          style={[styles.button, styles.rewardButton]}
          onPress={() => this.props.navigation.navigate('RewardClaimsScreen')}
        >
          <Icon name="gift-outline" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Reward Claims & Payouts</Text>
        </TouchableOpacity>

        {/* Order History */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.props.navigation.navigate('OrderHistory')}
        >
          <Icon name="receipt-outline" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Order History</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={this.handleLogout}
        >
          <Icon name="log-out-outline" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>

        {/* ImageSelector Modal */}
        <ImageSelector
          ref={(ref) => (this.imageSelectorRef = ref)}
          onImageSelected={this.handleImageSelect}
          singleSelection={true}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: appColors.bgColor,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  dummyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 22,
    fontFamily: 'Exo2-Bold',
    color: appColors.fontColor,
    marginBottom: 4,
  },
  mobile: {
    fontSize: 16,
    color: appColors.fontColor,
    fontFamily: 'Exo2-Regular',
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: appColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardButton: {
    backgroundColor: '#2C9A45',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
  },
  icon: {
    marginRight: 10,
  },
});
