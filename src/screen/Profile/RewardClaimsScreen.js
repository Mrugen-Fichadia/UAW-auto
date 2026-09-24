import React, { Component } from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appColors } from '../../component/Color';
import { RewardClaimsURL } from '../../component/URL';

export default class RewardClaimsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      refreshing: false,
      userPhone: '',
      claimedAmount: 0,
      pendingAmount: 0,
      totalClaimsCount: 0,
      claims: [],
      errorMsg: null,
    };
  }

  async componentDidMount() {
    await this.fetchUserPhoneAndClaims();
  }

  fetchUserPhoneAndClaims = async () => {
    try {
      this.setState({ loading: true, errorMsg: null });
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = userData ? JSON.parse(userData) : null;
      const userPhone = parsedUser ? (parsedUser.phone || parsedUser.mobile_number || parsedUser.number || '') : '';

      this.setState({ userPhone });

      if (!userPhone) {
        this.setState({
          loading: false,
          errorMsg: 'User phone number not found. Please log in again.',
        });
        return;
      }

      await this.loadRewardClaims(userPhone);
    } catch (error) {
      console.log('Error getting user data:', error);
      this.setState({
        loading: false,
        errorMsg: 'Failed to retrieve user information.',
      });
    }
  };

  loadRewardClaims = async (phone) => {
    try {
      const response = await fetch(RewardClaimsURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          mobile_number: phone,
        }),
      });

      const json = await response.json();

      if (response.ok && json.status && json.data) {
        this.setState({
          claimedAmount: json.data.claimed_amount || 0,
          pendingAmount: json.data.pending_amount || 0,
          totalClaimsCount: json.data.total_claims_count || 0,
          claims: json.data.claims || [],
          loading: false,
          refreshing: false,
        });
      } else {
        this.setState({
          claims: [],
          claimedAmount: 0,
          pendingAmount: 0,
          loading: false,
          refreshing: false,
          errorMsg: json.message || 'Unable to fetch reward claims history.',
        });
      }
    } catch (error) {
      console.log('Error fetching reward claims:', error);
      this.setState({
        loading: false,
        refreshing: false,
        errorMsg: 'Network error. Please check your internet connection.',
      });
    }
  };

  onRefresh = async () => {
    this.setState({ refreshing: true });
    if (this.state.userPhone) {
      await this.loadRewardClaims(this.state.userPhone);
    } else {
      await this.fetchUserPhoneAndClaims();
    }
  };

  renderStatusBadge = (paymentStatus, claimStatus) => {
    const pStatus = (paymentStatus || '').toLowerCase();
    const cStatus = (claimStatus || '').toLowerCase();

    if (['paid', 'approved', 'success', 'completed'].includes(pStatus)) {
      return (
        <View style={[styles.badge, styles.paidBadge]}>
          <Icon name="checkmark-circle" size={14} color="#15803D" style={{ marginRight: 4 }} />
          <Text style={styles.paidBadgeText}>Paid</Text>
        </View>
      );
    } else if (['rejected', 'failed', 'cancelled'].includes(pStatus) || cStatus === 'rejected') {
      return (
        <View style={[styles.badge, styles.rejectedBadge]}>
          <Icon name="close-circle" size={14} color="#B91C1C" style={{ marginRight: 4 }} />
          <Text style={styles.rejectedBadgeText}>Rejected</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.badge, styles.pendingBadge]}>
          <Icon name="time-outline" size={14} color="#B45309" style={{ marginRight: 4 }} />
          <Text style={styles.pendingBadgeText}>Pending Payment</Text>
        </View>
      );
    }
  };

  renderClaimItem = ({ item }) => {
    return (
      <View style={styles.claimCard}>
        <View style={styles.cardHeader}>
          <View style={styles.rewardTitleContainer}>
            <View style={styles.giftIconBox}>
              <MaterialIcons name="card-giftcard" size={24} color={appColors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.rewardTitle}>{item.reward_title || 'Reward Claim'}</Text>
              <Text style={styles.claimDate}>
                {item.claimed_at ? `Claimed on ${item.claimed_at}` : 'Date N/A'}
              </Text>
            </View>
          </View>
          <Text style={styles.rewardValue}>₹{parseFloat(item.reward_value || 0).toFixed(2)}</Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardDetailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            {this.renderStatusBadge(item.payment_status, item.claim_status)}
          </View>

          {item.upi_id && item.upi_id !== 'N/A' && (
            <View style={styles.detailItemRight}>
              <Text style={styles.detailLabel}>UPI / Account</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {item.upi_id}
              </Text>
            </View>
          )}
        </View>

        {item.payment_reference && item.payment_reference !== 'N/A' ? (
          <View style={styles.referenceRow}>
            <Text style={styles.referenceLabel}>Ref No: </Text>
            <Text style={styles.referenceValue}>{item.payment_reference}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  render() {
    const {
      loading,
      refreshing,
      claimedAmount,
      pendingAmount,
      totalClaimsCount,
      claims,
      errorMsg,
    } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={appColors.offWhite} barStyle="dark-content" />

        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => this.props.navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={appColors.fontColor} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reward Claims History</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={appColors.primary} />
            <Text style={styles.loadingText}>Fetching reward history...</Text>
          </View>
        ) : (
          <FlatList
            data={claims}
            keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
            renderItem={this.renderClaimItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={this.onRefresh}
                colors={[appColors.primary]}
              />
            }
            ListHeaderComponent={
              <View style={styles.summaryContainer}>
                {/* Claimed Amount (Transferred) Card */}
                <View style={[styles.summaryCard, styles.claimedCard]}>
                  <View style={styles.summaryIconContainerGreen}>
                    <Icon name="wallet" size={26} color="#15803D" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.summaryLabel}>Claimed Amount</Text>
                    <Text style={styles.summarySubtext}>Transferred to Bank</Text>
                    <Text style={styles.claimedAmountText}>
                      ₹{parseFloat(claimedAmount || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Pending Rewards Card */}
                <View style={[styles.summaryCard, styles.pendingCard]}>
                  <View style={styles.summaryIconContainerOrange}>
                    <Icon name="hourglass" size={24} color="#B45309" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.summaryLabel}>Pending Rewards</Text>
                    <Text style={styles.summarySubtext}>Yet to be transferred</Text>
                    <Text style={styles.pendingAmountText}>
                      ₹{parseFloat(pendingAmount || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Claim Records ({totalClaimsCount})</Text>
                </View>

                {errorMsg && (
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle-outline" size={20} color="#E62C2F" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              !errorMsg ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="history" size={60} color="#ccc" />
                  <Text style={styles.emptyTitle}>No Reward Claims Found</Text>
                  <Text style={styles.emptySubtitle}>
                    You haven't claimed any QR code rewards yet. Scan QR codes on product packs to start earning rewards!
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.bgColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: appColors.offWhite,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Exo2-Bold',
    color: appColors.fontColor,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Exo2-Regular',
    color: appColors.gray,
  },
  listContent: {
    paddingBottom: 30,
  },
  summaryContainer: {
    padding: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  claimedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  pendingCard: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  summaryIconContainerGreen: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconContainerOrange: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Exo2-Bold',
    color: '#1F2937',
  },
  summarySubtext: {
    fontSize: 12,
    fontFamily: 'Exo2-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  claimedAmountText: {
    fontSize: 22,
    fontFamily: 'Exo2-Bold',
    color: '#15803D',
  },
  pendingAmountText: {
    fontSize: 22,
    fontFamily: 'Exo2-Bold',
    color: '#D97706',
  },
  sectionHeaderRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Exo2-Bold',
    color: appColors.fontColor,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  giftIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTitle: {
    fontSize: 15,
    fontFamily: 'Exo2-Bold',
    color: '#111827',
  },
  claimDate: {
    fontSize: 12,
    fontFamily: 'Exo2-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  rewardValue: {
    fontSize: 18,
    fontFamily: 'Exo2-Bold',
    color: appColors.primary,
    marginLeft: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'column',
  },
  detailItemRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: '50%',
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'Exo2-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Exo2-Bold',
    color: '#374151',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidBadge: {
    backgroundColor: '#DCFCE7',
  },
  paidBadgeText: {
    fontSize: 12,
    fontFamily: 'Exo2-Bold',
    color: '#15803D',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontFamily: 'Exo2-Bold',
    color: '#B45309',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
  },
  rejectedBadgeText: {
    fontSize: 12,
    fontFamily: 'Exo2-Bold',
    color: '#B91C1C',
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  referenceLabel: {
    fontSize: 11,
    fontFamily: 'Exo2-Regular',
    color: '#6B7280',
  },
  referenceValue: {
    fontSize: 11,
    fontFamily: 'Exo2-Bold',
    color: '#4B5563',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 13,
    fontFamily: 'Exo2-Regular',
    color: '#B91C1C',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Exo2-Bold',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Exo2-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
