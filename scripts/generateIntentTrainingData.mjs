import fs from 'fs';
import path from 'path';

const trainingData = [
    // ── general_question ──
    { text: 'What should I know before using Kurukoo', label: 'general_question' },
    { text: 'How does Kurukoo work', label: 'general_question' },
    { text: 'Tell me about Kurukoo', label: 'general_question' },
    { text: 'What can I use Kurukoo for', label: 'general_question' },
    { text: 'Explain the Kurukoo platform', label: 'general_question' },
    { text: 'I want to learn more about this service', label: 'general_question' },
    { text: 'How do I get started on Kurukoo', label: 'general_question' },
    { text: 'What is this app for', label: 'general_question' },
    { text: 'Can you give me an overview', label: 'general_question' },
    { text: 'What does Kurukoo help people do', label: 'general_question' },
    { text: 'Tell me the basics please', label: 'general_question' },
    { text: 'I have a question about the platform', label: 'general_question' },

    // ── check_balance (13) ──
    { text: 'Check my credit balance', label: 'check_balance' },
    { text: 'How many credits do I have left', label: 'check_balance' },
    { text: 'Show wallet balance', label: 'check_balance' },
    { text: 'How many points do I have', label: 'check_balance' },
    { text: 'What is my wallet balance', label: 'check_balance' },
    { text: 'How much credit do I have remaining', label: 'check_balance' },
    { text: 'Show me my points balance please', label: 'check_balance' },
    { text: 'Check my wallet and points status', label: 'check_balance' },
    { text: 'I want to see my current balance', label: 'check_balance' },
    { text: 'How much do I have in my wallet', label: 'check_balance' },
    { text: 'Balance enquiry check my account', label: 'check_balance' },
    { text: 'Tell me my points and credit level', label: 'check_balance' },
    { text: 'View my wallet balance and tier status', label: 'check_balance' },

    // ── emergency (13) ──
    { text: 'I need an emergency police contact', label: 'emergency' },
    { text: 'Accident on expressway help me', label: 'emergency' },
    { text: 'Trigger SOS emergency alert', label: 'emergency' },
    { text: 'I feel unsafe need urgent help', label: 'emergency' },
    { text: 'Robbery attack call for emergency help', label: 'emergency' },
    { text: 'Please call emergency services now', label: 'emergency' },
    { text: 'There is a fire emergency near my house', label: 'emergency' },
    { text: 'I am in danger send help immediately', label: 'emergency' },
    { text: 'Medical emergency need ambulance fast', label: 'emergency' },
    { text: 'Emergency alert someone is following me', label: 'emergency' },
    { text: 'SOS I need urgent assistance right now', label: 'emergency' },
    { text: 'Call 112 emergency number for me', label: 'emergency' },
    { text: 'I need police help there is trouble here', label: 'emergency' },

    // ── circle_create (13) ──
    { text: 'Create a money circle ajo savings', label: 'circle_create' },
    { text: 'I want to join active savings circle', label: 'circle_create' },
    { text: 'Start an ajo esusu thrift group', label: 'circle_create' },
    { text: 'Open a savings circle with friends', label: 'circle_create' },
    { text: 'Create an ajo contribution group', label: 'circle_create' },
    { text: 'I want to start a thrift savings club', label: 'circle_create' },
    { text: 'Join a money circle esusu group', label: 'circle_create' },
    { text: 'Set up a rotating savings group', label: 'circle_create' },
    { text: 'Start a collective savings ajo circle', label: 'circle_create' },
    { text: 'Create a group contribution thrift plan', label: 'circle_create' },
    { text: 'I want to save money in a circle group', label: 'circle_create' },
    { text: 'Open an ajo savings group with my colleagues', label: 'circle_create' },
    { text: 'Begin a money circle for weekly savings', label: 'circle_create' },
    { text: 'Create a Money Circle', label: 'circle_create' },
    { text: 'Set up a money circle', label: 'circle_create' },
    { text: 'How do I create a money circle', label: 'circle_create' },
    { text: 'Start an ajo savings circle', label: 'circle_create' },
    { text: 'Create an esusu group', label: 'circle_create' },
    { text: 'Abeg help me start an ajo group', label: 'circle_create' },

    // ── ride_request (13) ──
    { text: 'Book an okada ride to Bodija', label: 'ride_request' },
    { text: 'I need a keke or taxi now', label: 'ride_request' },
    { text: 'Get me a ride to the airport', label: 'ride_request' },
    { text: 'Call a bike rider for me', label: 'ride_request' },
    { text: 'I need a cab to go home', label: 'ride_request' },
    { text: 'Book a taxi to take me to work', label: 'ride_request' },
    { text: 'I want an okada to come pick me up', label: 'ride_request' },
    { text: 'Find me a keke napep nearby', label: 'ride_request' },
    { text: 'I need a ride to the market now', label: 'ride_request' },
    { text: 'Get a bike to take me to my destination', label: 'ride_request' },
    { text: 'Order a car ride to Ikeja', label: 'ride_request' },
    { text: 'I want to book a keke ride', label: 'ride_request' },
    { text: 'Call me an okada rider immediately', label: 'ride_request' },

    // ── order_food (+ universal vendor product ordering §55.4) (13) ──
    { text: 'I am hungry order rice food', label: 'order_food' },
    { text: 'Order jollof rice and chicken', label: 'order_food' },
    { text: 'Buy groceries and foodstuff from the market', label: 'order_food' },
    { text: 'Order provisions and household supplies', label: 'order_food' },
    { text: 'I want to order a product from a vendor', label: 'order_food' },
    { text: 'I want to buy food from a restaurant nearby', label: 'order_food' },
    { text: 'Order amala and ewedu for me', label: 'order_food' },
    { text: 'I need to buy foodstuff for the week', label: 'order_food' },
    { text: 'Get me some pounded yam and egusi soup', label: 'order_food' },
    { text: 'I want to order groceries from a shop', label: 'order_food' },
    { text: 'Buy provisions from the supermarket', label: 'order_food' },
    { text: 'I am starving get me some food please', label: 'order_food' },
    { text: 'Order some snacks and drinks for delivery', label: 'order_food' },

    // ── find_worker (general trades + new verticals §55.1–§55.3) (13) ──
    { text: 'Find local plumber electrician mechanic near me', label: 'find_worker' },
    { text: 'I need a plumber to fix a leaking pipe', label: 'find_worker' },
    { text: 'Get me an electrician for house wiring', label: 'find_worker' },
    { text: 'I need a mechanic to check my engine', label: 'find_worker' },
    { text: 'I need a carpenter or furniture maker', label: 'find_worker' },
    { text: 'Find a tailor or fashion designer near me', label: 'find_worker' },
    { text: 'I need a cleaner or home cleaning service', label: 'find_worker' },
    // §55.1 Car Parts
    { text: 'Where can I buy spare parts for my vehicle', label: 'find_worker' },
    { text: 'I need an engine parts dealer near me', label: 'find_worker' },
    // §55.2 Security Personnel
    { text: 'I need a bodyguard for an event tonight', label: 'find_worker' },
    { text: 'Hire private security personnel for my shop', label: 'find_worker' },
    // §55.3 Sports / Recreation
    { text: 'Book a football pitch for a match', label: 'find_worker' },
    { text: 'Find a sports coach or recreation trainer', label: 'find_worker' },
    { text: 'Find somebody to repair my fridge', label: 'find_worker' },
    { text: 'Please get me a technician to fix my refrigerator', label: 'find_worker' },
    { text: 'Abeg help me find person wey fit repair fridge', label: 'find_worker' },
    { text: 'Who can fix my freezer around here', label: 'find_worker' },
    { text: 'I need someone to paint my place', label: 'find_worker' },
    { text: 'Please connect me with a painter for my house', label: 'find_worker' },
    { text: 'Get a handyman to repair my broken appliance', label: 'find_worker' },
    { text: 'Find me a technician near my location', label: 'find_worker' },

    // ── sports_matchmaking ──
    { text: 'Help me find a football match this weekend', label: 'sports_matchmaking' },
    { text: 'Find a football game to join near me', label: 'sports_matchmaking' },
    { text: 'I want to play football with other people', label: 'sports_matchmaking' },
    { text: 'Help me meet players for a match', label: 'sports_matchmaking' },
    { text: 'Find a basketball game around my area', label: 'sports_matchmaking' },
    { text: 'I need teammates for football', label: 'sports_matchmaking' },
    { text: 'Connect me to sports players nearby', label: 'sports_matchmaking' },
    { text: 'Abeg find football people to play with', label: 'sports_matchmaking' },
    { text: 'Arrange a local sports match for me', label: 'sports_matchmaking' },
    { text: 'Where can I join a five aside game', label: 'sports_matchmaking' },
    { text: 'Find me a tennis partner', label: 'sports_matchmaking' },
    { text: 'I want to join a basketball team', label: 'sports_matchmaking' },

    // ── pay_bill (13) ──
    { text: 'Pay electricity bill utility DSTV', label: 'pay_bill' },
    { text: 'Pay my power bill NEPA Eko Disco', label: 'pay_bill' },
    { text: 'Settle my DSTV GoTV subscription', label: 'pay_bill' },
    { text: 'Pay water bill and internet subscription', label: 'pay_bill' },
    { text: 'I want to pay my electricity bill online', label: 'pay_bill' },
    { text: 'Pay my cable TV subscription for the month', label: 'pay_bill' },
    { text: 'Settle my utility bills power and water', label: 'pay_bill' },
    { text: 'I need to pay my NEPA bill today', label: 'pay_bill' },
    { text: 'Pay my internet subscription and data plan', label: 'pay_bill' },
    { text: 'Renew my DSTV and GoTV subscription', label: 'pay_bill' },
    { text: 'I want to settle my Eko Disco electricity bill', label: 'pay_bill' },
    { text: 'Pay utility bills for my house', label: 'pay_bill' },
    { text: 'Settle my monthly water and power bill', label: 'pay_bill' },

    // ── airtime_purchase (13) ──
    { text: 'Buy MTN Airtel airtime recharge topup', label: 'airtime_purchase' },
    { text: 'Recharge my Glo line with airtime', label: 'airtime_purchase' },
    { text: 'Buy data bundle 9mobile', label: 'airtime_purchase' },
    { text: 'Top up my phone credit', label: 'airtime_purchase' },
    { text: 'Buy mtn airtime for my line', label: 'airtime_purchase' },
    { text: 'I want to recharge my Airtel line', label: 'airtime_purchase' },
    { text: 'Buy data for my 9mobile sim', label: 'airtime_purchase' },
    { text: 'Topup my Glo airtime balance', label: 'airtime_purchase' },
    { text: 'I need to buy airtime credit now', label: 'airtime_purchase' },
    { text: 'Recharge my phone with data bundle', label: 'airtime_purchase' },
    { text: 'Buy mtn data subscription plan', label: 'airtime_purchase' },
    { text: 'I want to top up my Airtel airtime', label: 'airtime_purchase' },
    { text: 'Get me airtime recharge for my Glo number', label: 'airtime_purchase' },

    // ── nearby_pulse_start (+ how-to video §55.5 + event coverage §36.1.3) (13) ──
    { text: 'Go live on Nearby Pulse and broadcast', label: 'nearby_pulse_start' },
    { text: 'Start a live broadcast of my skill', label: 'nearby_pulse_start' },
    { text: 'I want to share a how-to video tutorial', label: 'nearby_pulse_start' },
    { text: 'Broadcast event coverage from a live scene', label: 'nearby_pulse_start' },
    { text: 'Go live and stream what is happening around me', label: 'nearby_pulse_start' },
    { text: 'How to video tutorial I want to broadcast', label: 'nearby_pulse_start' },
    { text: 'Start a live stream showing my work', label: 'nearby_pulse_start' },
    { text: 'I want to go live and share a video tutorial', label: 'nearby_pulse_start' },
    { text: 'Broadcast live video of this event scene', label: 'nearby_pulse_start' },
    { text: 'Go live on pulse to show people my skill', label: 'nearby_pulse_start' },
    { text: 'I want to stream a how to tutorial live', label: 'nearby_pulse_start' },
    { text: 'Start broadcasting my live video now', label: 'nearby_pulse_start' },
    { text: 'Share a live video tutorial with nearby users', label: 'nearby_pulse_start' },

    // ── referral (13) ──
    { text: 'Refer a friend referral invite code', label: 'referral' },
    { text: 'Share my referral code to invite people', label: 'referral' },
    { text: 'I want to invite friends and earn points', label: 'referral' },
    { text: 'Refer a friend for points', label: 'referral' },
    { text: 'Refer friend and get rewarded', label: 'referral' },
    { text: 'Invite friend to earn bonus', label: 'referral' },
    { text: 'Get my referral code to share', label: 'referral' },
    { text: 'Invite a friend and get bonus points', label: 'referral' },
    { text: 'I want to refer someone to join Kurukoo', label: 'referral' },
    { text: 'Share my invite link with friends', label: 'referral' },
    { text: 'How do I refer people to earn rewards', label: 'referral' },
    { text: 'I want to send my referral code to a friend', label: 'referral' },
    { text: 'Refer friends and get free points', label: 'referral' },
    { text: 'Give me my referral invite code', label: 'referral' },
    { text: 'I want to invite my contacts to Kurukoo', label: 'referral' },
    { text: 'How do referrals work', label: 'referral' },
    { text: 'How can I refer someone', label: 'referral' },
    { text: 'Explain the referral rewards', label: 'referral' },
    { text: 'Where is my referral link', label: 'referral' },
    { text: 'Abeg show me my invite link', label: 'referral' },
    { text: 'Share referral link and earn bonus credits', label: 'referral' },

    // ── subscription ──
    { text: 'What subscriptions are available', label: 'subscription' },
    { text: 'Show me Kurukoo subscription plans', label: 'subscription' },
    { text: 'How much is the provider plan', label: 'subscription' },
    { text: 'I want to upgrade my Kurukoo membership', label: 'subscription' },
    { text: 'Which plan can I use for my business', label: 'subscription' },
    { text: 'Abeg show me the subscription options', label: 'subscription' },

    // ── advertising ──
    { text: 'How can I advertise on Kurukoo', label: 'advertising' },
    { text: 'I want to promote my business', label: 'advertising' },
    { text: 'Show me the advertising options', label: 'advertising' },
    { text: 'How do I create a campaign', label: 'advertising' },
    { text: 'I want to reach customers through Kurukoo', label: 'advertising' },
    { text: 'Help me place a sponsored promotion', label: 'advertising' },
    { text: 'How can I advertise on Kurukoo', label: 'advertising' },
    { text: 'How do I advertise my business on Kurukoo', label: 'advertising' },
    { text: 'I want to run an advert on Kurukoo', label: 'advertising' },
    { text: 'Show me the Kurukoo advertiser page', label: 'advertising' },
    { text: 'I want to promote my shop on Kurukoo', label: 'advertising' },
    { text: 'Abeg help me advertise my business', label: 'advertising' },

    // ── autonomous_agent ──
    { text: 'Show me my agents', label: 'autonomous_agent' },
    { text: 'Create an agent to keep checking for a plumber', label: 'autonomous_agent' },
    { text: 'What is my agent doing', label: 'autonomous_agent' },
    { text: 'Pause my agent goal', label: 'autonomous_agent' },
    { text: 'Resume the agent that is monitoring my request', label: 'autonomous_agent' },
    { text: 'Cancel my autonomous agent', label: 'autonomous_agent' },

    // ── points ──
    { text: 'How do I earn Points on Kurukoo', label: 'view_balance' },
    { text: 'Show my Points balance and history', label: 'view_balance' },
    { text: 'Can I top up my Points', label: 'view_balance' },

    // ── nearby pulse ──
    { text: 'Turn on Go Live for Nearby Pulse', label: 'nearby_pulse_start' },
    { text: 'How do I appear on Nearby Radar', label: 'nearby_pulse_start' },
    { text: 'Switch off my live provider status', label: 'nearby_pulse_stop' },
];

const outputDir = path.join(process.cwd(), 'models');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'intent_training_data.txt');
const content = trainingData.map(item => `__label__${item.label} ${item.text}`).join('\n');

fs.writeFileSync(outputPath, content);
console.log(`Successfully generated training data at: ${outputPath} (${trainingData.length} examples)`);
// NOTE: The real model binary (kurukoo_intent.bin) is produced by the fasttext CLI
// via `fasttext supervised ...` — see src/services/fastTextService.ts initializeFastText().
// We deliberately do NOT write a dummy bin here so a stale stub is never created.
